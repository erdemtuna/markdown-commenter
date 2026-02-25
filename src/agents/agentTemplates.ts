import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Agent template loaded from .agent.md file
 */
export interface AgentTemplate {
  /** Filename without path (e.g., "Annotate.agent.md") */
  filename: string;
  /** Raw content of the agent file */
  content: string;
}

/**
 * Load all agent templates from the extension's agents/ directory
 * @param extensionUri The extension's base URI
 * @returns Array of agent templates
 */
export async function loadAgentTemplates(extensionUri: vscode.Uri): Promise<AgentTemplate[]> {
  const agentsDir = vscode.Uri.joinPath(extensionUri, 'agents');
  const templates: AgentTemplate[] = [];

  try {
    const entries = await vscode.workspace.fs.readDirectory(agentsDir);
    
    for (const [filename, fileType] of entries) {
      if (fileType === vscode.FileType.File && filename.endsWith('.agent.md')) {
        const fileUri = vscode.Uri.joinPath(agentsDir, filename);
        const contentBytes = await vscode.workspace.fs.readFile(fileUri);
        const content = Buffer.from(contentBytes).toString('utf-8');
        
        templates.push({ filename, content });
      }
    }
  } catch (error) {
    // Directory may not exist in some scenarios
    console.error('Failed to load agent templates:', error);
  }

  return templates;
}

/**
 * Write processed agent content to the prompts directory
 * @param promptsDir The target prompts directory
 * @param filename The agent filename
 * @param content The processed agent content
 */
export async function writeAgentToPromptsDir(
  promptsDir: string,
  filename: string,
  content: string
): Promise<void> {
  // Ensure prompts directory exists
  await fs.mkdir(promptsDir, { recursive: true });
  
  const targetPath = path.join(promptsDir, filename);
  await fs.writeFile(targetPath, content, 'utf-8');
}

/**
 * Check if an agent file exists in the prompts directory
 * @param promptsDir The prompts directory
 * @param filename The agent filename
 * @returns true if the file exists
 */
export async function agentExistsInPromptsDir(
  promptsDir: string,
  filename: string
): Promise<boolean> {
  const targetPath = path.join(promptsDir, filename);
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
