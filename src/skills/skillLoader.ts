import * as vscode from 'vscode';

/**
 * Skill catalog entry (summary info)
 */
export interface SkillCatalogEntry {
  /** Skill name from frontmatter */
  name: string;
  /** Skill description from frontmatter */
  description: string;
  /** Directory name in skills/ */
  directory: string;
}

/**
 * Full skill content with metadata
 */
export interface SkillContent {
  /** Skill name from frontmatter */
  name: string;
  /** Skill description from frontmatter */
  description: string;
  /** Full markdown content (including frontmatter) */
  content: string;
}

/**
 * Parse YAML frontmatter from skill content
 * @param content Raw skill file content
 * @returns Parsed name and description, or null if invalid
 */
export function parseSkillFrontmatter(content: string): { name: string; description: string } | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch || !descMatch) {
    return null;
  }

  return {
    name: nameMatch[1].trim(),
    description: descMatch[1].trim()
  };
}

/**
 * Load the skill catalog from the extension's skills/ directory
 * @param extensionUri The extension's base URI
 * @returns Array of skill catalog entries
 */
export async function loadSkillCatalog(extensionUri: vscode.Uri): Promise<SkillCatalogEntry[]> {
  const skillsDir = vscode.Uri.joinPath(extensionUri, 'skills');
  const catalog: SkillCatalogEntry[] = [];

  try {
    const entries = await vscode.workspace.fs.readDirectory(skillsDir);
    
    for (const [dirname, fileType] of entries) {
      if (fileType === vscode.FileType.Directory) {
        const skillFileUri = vscode.Uri.joinPath(skillsDir, dirname, 'SKILL.md');
        
        try {
          const contentBytes = await vscode.workspace.fs.readFile(skillFileUri);
          const content = Buffer.from(contentBytes).toString('utf-8');
          const metadata = parseSkillFrontmatter(content);
          
          if (metadata) {
            catalog.push({
              name: metadata.name,
              description: metadata.description,
              directory: dirname
            });
          }
        } catch {
          // SKILL.md may not exist in some directories
        }
      }
    }
  } catch (error) {
    console.error('Failed to load skill catalog:', error);
  }

  return catalog;
}

/**
 * Load full skill content by name
 * @param extensionUri The extension's base URI
 * @param skillName The skill name to load
 * @returns Skill content or null if not found
 */
export async function loadSkillContent(
  extensionUri: vscode.Uri,
  skillName: string
): Promise<SkillContent | null> {
  const skillsDir = vscode.Uri.joinPath(extensionUri, 'skills');

  try {
    const entries = await vscode.workspace.fs.readDirectory(skillsDir);
    
    for (const [dirname, fileType] of entries) {
      if (fileType === vscode.FileType.Directory) {
        const skillFileUri = vscode.Uri.joinPath(skillsDir, dirname, 'SKILL.md');
        
        try {
          const contentBytes = await vscode.workspace.fs.readFile(skillFileUri);
          const content = Buffer.from(contentBytes).toString('utf-8');
          const metadata = parseSkillFrontmatter(content);
          
          if (metadata && metadata.name === skillName) {
            return {
              name: metadata.name,
              description: metadata.description,
              content
            };
          }
        } catch {
          // Skip directories without SKILL.md
        }
      }
    }
  } catch (error) {
    console.error('Failed to load skill content:', error);
  }

  return null;
}
