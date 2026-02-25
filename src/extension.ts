import * as vscode from 'vscode';
import { installAgentsIfNeeded } from './agents/installer';
import { registerSkillTool } from './tools/skillTool';
import { registerAnnotateCommand, registerAnnotateWithStatusCommand, registerRevealAnnotationCommand } from './ui/commands';
import { AnnotationCodeLensProvider, registerCodeLensProvider } from './ui/codelens';
import { registerAnnotationHoverProvider } from './ui/hover';

const OUTPUT_CHANNEL_NAME = 'Markdown Commenter';

/**
 * Extension activation function called when extension is first needed.
 * 
 * Activates on VS Code startup (onStartupFinished event) to ensure the
 * annotation agent is installed before users interact with Copilot.
 */
export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(outputChannel);
  
  outputChannel.appendLine('[INFO] Markdown Commenter extension activated');

  // Install agents to prompts directory
  try {
    const installed = await installAgentsIfNeeded(context, outputChannel);
    if (installed > 0) {
      outputChannel.appendLine(`[INFO] Installed ${installed} agent(s)`);
    }
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to install agents: ${error}`);
  }

  // Register Language Model Tool for skill access
  try {
    const toolDisposable = registerSkillTool(context);
    context.subscriptions.push(toolDisposable);
    outputChannel.appendLine('[INFO] Registered skill tool');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register skill tool: ${error}`);
  }

  // Register UI commands
  try {
    const annotateCommand = registerAnnotateCommand();
    context.subscriptions.push(annotateCommand);
    outputChannel.appendLine('[INFO] Registered annotate command');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register annotate command: ${error}`);
  }

  // Register annotate with status command (for hover UI)
  try {
    const annotateWithStatusCommand = registerAnnotateWithStatusCommand();
    context.subscriptions.push(annotateWithStatusCommand);
    outputChannel.appendLine('[INFO] Registered annotate with status command');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register annotate with status command: ${error}`);
  }

  // Register hover provider for contextual annotation UI
  try {
    const hoverDisposable = registerAnnotationHoverProvider();
    context.subscriptions.push(hoverDisposable);
    outputChannel.appendLine('[INFO] Registered annotation hover provider');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register annotation hover provider: ${error}`);
  }

  // Register reveal annotation command (for CodeLens click)
  try {
    const revealCommand = registerRevealAnnotationCommand();
    context.subscriptions.push(revealCommand);
    outputChannel.appendLine('[INFO] Registered reveal annotation command');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register reveal annotation command: ${error}`);
  }

  // Register CodeLens provider for markdown files
  try {
    const codeLensProvider = new AnnotationCodeLensProvider();
    const codeLensDisposable = registerCodeLensProvider(codeLensProvider);
    context.subscriptions.push(codeLensDisposable);
    context.subscriptions.push(codeLensProvider);

    // Set up document change listener to trigger CodeLens refresh
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'markdown') {
        codeLensProvider.triggerRefresh();
      }
    });
    context.subscriptions.push(documentChangeListener);

    outputChannel.appendLine('[INFO] Registered CodeLens provider');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register CodeLens provider: ${error}`);
  }

  outputChannel.appendLine('[INFO] Markdown Commenter extension ready');
}

/**
 * Extension deactivation function called when extension is being disabled.
 */
export function deactivate() {
  // Cleanup handled by VS Code disposing subscriptions
}
