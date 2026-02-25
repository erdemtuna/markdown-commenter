import * as vscode from 'vscode';
import { installAgentsIfNeeded } from './agents/installer';
import { registerSkillTool } from './tools/skillTool';
import { registerAnnotateCommand, registerAnnotateWithStatusCommand, registerRevealAnnotationCommand } from './ui/commands';
import { AnnotationCodeLensProvider, registerCodeLensProvider } from './ui/codelens';
import { registerAnnotationHoverProvider } from './ui/hover';
import { registerAnnotationsPanelProvider, registerFocusAnnotationsViewCommand, AnnotationsPanelProvider } from './ui/sidebar';
import { AnnotationStatusBar } from './ui/statusbar';

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
  let codeLensProvider: AnnotationCodeLensProvider | undefined;
  try {
    codeLensProvider = new AnnotationCodeLensProvider();
    const codeLensDisposable = registerCodeLensProvider(codeLensProvider);
    context.subscriptions.push(codeLensDisposable);
    context.subscriptions.push(codeLensProvider);

    outputChannel.appendLine('[INFO] Registered CodeLens provider');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register CodeLens provider: ${error}`);
  }

  // Register sidebar panel provider for annotations view
  let sidebarProvider: AnnotationsPanelProvider | undefined;
  try {
    sidebarProvider = registerAnnotationsPanelProvider(context);
    outputChannel.appendLine('[INFO] Registered annotations panel provider');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register annotations panel provider: ${error}`);
  }

  // Register focus annotations view command (for status bar click)
  try {
    const focusCommand = registerFocusAnnotationsViewCommand();
    context.subscriptions.push(focusCommand);
    outputChannel.appendLine('[INFO] Registered focus annotations view command');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register focus annotations view command: ${error}`);
  }

  // Create status bar item for annotation count
  let statusBar: AnnotationStatusBar | undefined;
  try {
    statusBar = new AnnotationStatusBar();
    context.subscriptions.push(statusBar);
    // Initialize with current editor
    statusBar.update(vscode.window.activeTextEditor?.document);
    outputChannel.appendLine('[INFO] Created status bar item');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to create status bar item: ${error}`);
  }

  // Set up shared event listeners for CodeLens, Sidebar, and Status Bar updates
  try {
    // Document change listener (debounced for sidebar, triggers CodeLens and status bar refresh)
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'markdown') {
        // Trigger CodeLens refresh (internal debouncing)
        codeLensProvider?.triggerRefresh();
        // Trigger sidebar debounced refresh (300ms per NFR-2)
        sidebarProvider?.triggerDebouncedRefresh(event.document);
        // Update status bar count (immediate - lightweight operation)
        statusBar?.update(event.document);
      }
    });
    context.subscriptions.push(documentChangeListener);

    // Active editor change listener (immediate refresh for sidebar and status bar)
    const editorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
      // Update sidebar immediately when switching editors
      sidebarProvider?.updateAnnotations(editor?.document);
      // Update status bar count
      statusBar?.update(editor?.document);
    });
    context.subscriptions.push(editorChangeListener);

    outputChannel.appendLine('[INFO] Registered document and editor change listeners');
  } catch (error) {
    outputChannel.appendLine(`[ERROR] Failed to register change listeners: ${error}`);
  }

  outputChannel.appendLine('[INFO] Markdown Commenter extension ready');
}

/**
 * Extension deactivation function called when extension is being disabled.
 */
export function deactivate() {
  // Cleanup handled by VS Code disposing subscriptions
}
