import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Platform types for prompts directory resolution
 */
export type Platform = 'darwin' | 'win32' | 'linux' | 'wsl';

/**
 * Detect if running in WSL
 */
export function isWSL(): boolean {
  if (os.platform() !== 'linux') {
    return false;
  }
  try {
    const versionContent = fs.readFileSync('/proc/version', 'utf8');
    return versionContent.toLowerCase().includes('microsoft') || 
           versionContent.toLowerCase().includes('wsl');
  } catch {
    return !!(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP);
  }
}

/**
 * Get Windows username from WSL
 */
export function getWindowsUsernameFromWSL(): string | undefined {
  try {
    const usersDir = '/mnt/c/Users';
    if (!fs.existsSync(usersDir)) {
      return undefined;
    }
    const users = fs.readdirSync(usersDir);
    const validUsers = users.filter(u => 
      !['Public', 'Default', 'Default User', 'All Users', 'desktop.ini'].includes(u)
    );
    if (validUsers.length === 1) {
      return validUsers[0];
    }
    // Try to match LOGNAME
    if (validUsers.length > 1 && process.env.LOGNAME && process.env.LOGNAME !== 'root') {
      const logname = process.env.LOGNAME.toLowerCase();
      const match = validUsers.find(u => u.toLowerCase() === logname || u.toLowerCase().startsWith(logname));
      if (match) {
        return match;
      }
    }
  } catch {
    // Ignore
  }
  return process.env.LOGNAME && process.env.LOGNAME !== 'root' ? process.env.LOGNAME : undefined;
}

/**
 * Get the current platform
 * @returns The platform identifier
 */
export function getPlatformInfo(): Platform {
  const platform = os.platform();
  if (platform === 'linux' && isWSL()) {
    return 'wsl';
  }
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return platform;
  }
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
    case 'wsl': {
      const windowsUser = getWindowsUsernameFromWSL();
      if (windowsUser) {
        return path.posix.join('/mnt/c/Users', windowsUser, 'AppData', 'Roaming', 'Code', 'User', 'prompts');
      }
      // Fallback to Linux path if Windows user not found
      return path.join(homeDir, '.config', 'Code', 'User', 'prompts');
    }
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
