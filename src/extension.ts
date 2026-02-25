import * as vscode from 'vscode';

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

  // TODO: Phase 4 - Install agent to prompts directory
  // await installAgentIfNeeded(context, outputChannel);

  // TODO: Phase 4 - Register Language Model Tool for skill access
  // registerSkillTool(context, outputChannel);

  outputChannel.appendLine('[INFO] Markdown Commenter extension ready');
}

/**
 * Extension deactivation function called when extension is being disabled.
 */
export function deactivate() {
  // Cleanup handled by VS Code disposing subscriptions
}
