import * as vscode from 'vscode';
import { installAgentsIfNeeded } from './agents/installer';
import { registerSkillTool } from './tools/skillTool';
import { registerAnnotateCommand } from './ui/commands';

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

  outputChannel.appendLine('[INFO] Markdown Commenter extension ready');
}

/**
 * Extension deactivation function called when extension is being disabled.
 */
export function deactivate() {
  // Cleanup handled by VS Code disposing subscriptions
}
