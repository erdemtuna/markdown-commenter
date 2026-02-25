import * as vscode from 'vscode';
import { loadSkillContent } from '../skills/skillLoader';

/**
 * Tool input schema for the skill tool
 */
interface SkillToolInput {
  skill_name?: string;
}

/**
 * Language Model Tool for retrieving skill content
 * Implements vscode.LanguageModelTool interface
 */
export class AnnotateSkillTool implements vscode.LanguageModelTool<SkillToolInput> {
  private extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  /**
   * Invoke the tool to get skill content
   */
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<SkillToolInput>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const skillName = options.input?.skill_name || 'annotate';
    
    const skill = await loadSkillContent(this.extensionUri, skillName);
    
    if (!skill) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Skill "${skillName}" not found`)
      ]);
    }

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(skill.content)
    ]);
  }

  /**
   * Prepare invocation with user confirmation message
   */
  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationOptions<SkillToolInput>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): Promise<vscode.PreparedToolInvocation> {
    const skillName = options.input?.skill_name || 'annotate';
    
    return {
      invocationMessage: `Loading skill: ${skillName}`
    };
  }
}

/**
 * Register the skill tool with VS Code
 * @param context Extension context
 * @returns Disposable for the registered tool
 */
export function registerSkillTool(context: vscode.ExtensionContext): vscode.Disposable {
  const tool = new AnnotateSkillTool(context.extensionUri);
  
  return vscode.lm.registerTool('markdown-commenter-skill', tool);
}
