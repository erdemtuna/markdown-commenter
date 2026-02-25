import * as vscode from 'vscode';
import { loadAgentTemplates, writeAgentToPromptsDir } from './agentTemplates';
import { processConditionalBlocks } from './agentTemplateRenderer';
import { getPromptsDirectory } from './platformDetection';

const INSTALLATION_STATE_KEY = 'markdown-commenter.installation.state';

/**
 * Installation state tracking
 */
export interface InstallationState {
  /** Extension version that was last installed */
  version: string;
  /** Timestamp of last installation */
  installedAt: string;
  /** List of installed agent filenames */
  agents: string[];
}

/**
 * Check if agent installation is needed
 * @param context Extension context
 * @param currentVersion Current extension version
 * @returns true if installation is needed
 */
export function needsInstallation(
  context: vscode.ExtensionContext,
  currentVersion: string
): boolean {
  // Development versions always reinstall
  if (currentVersion.includes('-dev')) {
    return true;
  }

  const state = context.globalState.get<InstallationState>(INSTALLATION_STATE_KEY);
  
  if (!state) {
    return true;
  }

  return state.version !== currentVersion;
}

/**
 * Install agents to the prompts directory
 * @param context Extension context
 * @param outputChannel Output channel for logging
 * @returns Number of agents installed
 */
export async function installAgents(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): Promise<number> {
  const extensionUri = context.extensionUri;
  const version = context.extension.packageJSON.version as string;
  
  outputChannel.appendLine(`Installing agents (version: ${version})...`);

  // Load templates
  const templates = await loadAgentTemplates(extensionUri);
  
  if (templates.length === 0) {
    outputChannel.appendLine('No agent templates found');
    return 0;
  }

  // Get prompts directory (with optional custom path from settings)
  const customPath = vscode.workspace.getConfiguration('markdown-commenter').get<string>('promptsDirectory');
  const promptsDir = getPromptsDirectory(customPath);
  
  outputChannel.appendLine(`Prompts directory: ${promptsDir}`);

  const installedAgents: string[] = [];

  for (const template of templates) {
    try {
      // Process for VS Code environment
      const processedContent = processConditionalBlocks(template.content, 'vscode');
      
      // Write to prompts directory
      await writeAgentToPromptsDir(promptsDir, template.filename, processedContent);
      installedAgents.push(template.filename);
      
      outputChannel.appendLine(`  ✓ Installed: ${template.filename}`);
    } catch (error) {
      outputChannel.appendLine(`  ✗ Failed to install ${template.filename}: ${error}`);
    }
  }

  // Update installation state
  const state: InstallationState = {
    version,
    installedAt: new Date().toISOString(),
    agents: installedAgents
  };
  await context.globalState.update(INSTALLATION_STATE_KEY, state);

  outputChannel.appendLine(`Installed ${installedAgents.length} agent(s)`);
  return installedAgents.length;
}

/**
 * Install agents if needed based on version check
 * @param context Extension context
 * @param outputChannel Output channel for logging
 * @returns Number of agents installed (0 if skipped)
 */
export async function installAgentsIfNeeded(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
): Promise<number> {
  const version = context.extension.packageJSON.version as string;
  
  if (!needsInstallation(context, version)) {
    outputChannel.appendLine('Agents already installed (version match)');
    return 0;
  }

  return installAgents(context, outputChannel);
}

/**
 * Get the current installation state
 * @param context Extension context
 * @returns The installation state or undefined if not installed
 */
export function getInstallationState(
  context: vscode.ExtensionContext
): InstallationState | undefined {
  return context.globalState.get<InstallationState>(INSTALLATION_STATE_KEY);
}
