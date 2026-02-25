/**
 * Environment types for conditional block processing
 */
export type Environment = 'vscode' | 'cli';

/**
 * Process conditional blocks in template content
 * Keeps content for the target environment, removes content for other environments
 * 
 * Syntax:
 * - {{#vscode}}...content...{{/vscode}} - Included only for VS Code
 * - {{#cli}}...content...{{/cli}} - Included only for CLI
 * 
 * @param content The template content with conditional blocks
 * @param environment The target environment ('vscode' or 'cli')
 * @returns Processed content with appropriate blocks kept/removed
 */
export function processConditionalBlocks(content: string, environment: Environment): string {
  let result = content;
  
  // Process vscode blocks
  if (environment === 'vscode') {
    // Keep vscode content (remove tags only)
    result = result.replace(/\{\{#vscode\}\}\n?/g, '');
    result = result.replace(/\{\{\/vscode\}\}\n?/g, '');
    // Remove cli content entirely
    result = result.replace(/\{\{#cli\}\}[\s\S]*?\{\{\/cli\}\}\n?/g, '');
  } else {
    // Keep cli content (remove tags only)
    result = result.replace(/\{\{#cli\}\}\n?/g, '');
    result = result.replace(/\{\{\/cli\}\}\n?/g, '');
    // Remove vscode content entirely
    result = result.replace(/\{\{#vscode\}\}[\s\S]*?\{\{\/vscode\}\}\n?/g, '');
  }
  
  // Clean up any double blank lines that may result
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

/**
 * Check if content contains conditional blocks
 * @param content The content to check
 * @returns true if conditional blocks are present
 */
export function hasConditionalBlocks(content: string): boolean {
  return /\{\{#(vscode|cli)\}\}/.test(content);
}

/**
 * Get list of environments referenced in conditional blocks
 * @param content The content to analyze
 * @returns Array of environment names found
 */
export function getEnvironmentsInContent(content: string): Environment[] {
  const environments: Environment[] = [];
  if (/\{\{#vscode\}\}/.test(content)) {
    environments.push('vscode');
  }
  if (/\{\{#cli\}\}/.test(content)) {
    environments.push('cli');
  }
  return environments;
}
