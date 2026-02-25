import * as os from 'os';
import * as path from 'path';

/**
 * Platform types for prompts directory resolution
 */
export type Platform = 'darwin' | 'win32' | 'linux';

/**
 * Get the current platform
 * @returns The platform identifier
 */
export function getPlatformInfo(): Platform {
  const platform = os.platform();
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return platform;
  }
  // Default to linux for unknown platforms
  return 'linux';
}

/**
 * Resolve the VS Code prompts directory for a given platform
 * @param platform The target platform
 * @param customPath Optional custom path override
 * @returns The prompts directory path
 */
export function resolvePromptsDirectory(platform: Platform, customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  const homeDir = os.homedir();
  
  switch (platform) {
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'prompts');
    case 'win32':
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'Code', 'User', 'prompts');
    case 'linux':
    default:
      return path.join(homeDir, '.config', 'Code', 'User', 'prompts');
  }
}

/**
 * Get the VS Code prompts directory for the current platform
 * @param customPath Optional custom path override
 * @returns The prompts directory path
 */
export function getPromptsDirectory(customPath?: string): string {
  return resolvePromptsDirectory(getPlatformInfo(), customPath);
}
