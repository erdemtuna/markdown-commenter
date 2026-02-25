/**
 * Markdown Commenter CLI Installer
 * 
 * Handles installation, uninstallation, and listing of skill and agent
 * for GitHub Copilot CLI users.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PACKAGE_VERSION = require('../package.json').version;
const MANIFEST_DIR = path.join(os.homedir(), '.paw', 'markdown-commenter');
const MANIFEST_FILE = path.join(MANIFEST_DIR, 'manifest.json');

/**
 * Get target directories for installation
 */
function getTargetPaths(target) {
  if (target === 'copilot') {
    const copilotDir = path.join(os.homedir(), '.copilot');
    return {
      agents: path.join(copilotDir, 'agents'),
      skills: path.join(copilotDir, 'skills')
    };
  }
  throw new Error(`Unknown target: ${target}`);
}

/**
 * Get distribution directory path
 */
function getDistDir() {
  return path.join(__dirname, '..', 'dist');
}

/**
 * Read current installation manifest
 */
function readManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    }
  } catch {
    // Ignore invalid manifest
  }
  return null;
}

/**
 * Write installation manifest
 */
function writeManifest(manifest) {
  fs.mkdirSync(MANIFEST_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

/**
 * Delete manifest file
 */
function deleteManifest() {
  if (fs.existsSync(MANIFEST_FILE)) {
    fs.unlinkSync(MANIFEST_FILE);
  }
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Remove directory recursively if it exists
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Install skill and agent to target
 */
async function install(target) {
  console.log(`Installing Markdown Commenter v${PACKAGE_VERSION} to ${target}...`);
  
  const distDir = getDistDir();
  
  // Check if dist exists
  if (!fs.existsSync(distDir)) {
    console.error('Error: Distribution not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const paths = getTargetPaths(target);
  
  // Install agents
  const agentsSrc = path.join(distDir, 'agents');
  if (fs.existsSync(agentsSrc)) {
    fs.mkdirSync(paths.agents, { recursive: true });
    for (const file of fs.readdirSync(agentsSrc)) {
      const src = path.join(agentsSrc, file);
      const dest = path.join(paths.agents, file);
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Installed agent: ${file}`);
    }
  }
  
  // Install skills
  const skillsSrc = path.join(distDir, 'skills');
  if (fs.existsSync(skillsSrc)) {
    for (const skillDir of fs.readdirSync(skillsSrc)) {
      const srcSkillDir = path.join(skillsSrc, skillDir);
      const destSkillDir = path.join(paths.skills, skillDir);
      copyDir(srcSkillDir, destSkillDir);
      console.log(`  ✓ Installed skill: ${skillDir}`);
    }
  }
  
  // Write manifest
  writeManifest({
    version: PACKAGE_VERSION,
    target,
    installedAt: new Date().toISOString(),
    files: {
      agents: paths.agents,
      skills: paths.skills
    }
  });
  
  console.log('');
  console.log('Installation complete!');
  console.log('');
  console.log('The annotation skill is now available in Copilot CLI.');
  console.log('Try: @annotate help');
}

/**
 * Uninstall skill and agent
 */
async function uninstall() {
  const manifest = readManifest();
  
  if (!manifest) {
    console.log('Markdown Commenter is not installed.');
    return;
  }
  
  console.log(`Uninstalling Markdown Commenter v${manifest.version}...`);
  
  // Remove agent file
  const agentFile = path.join(manifest.files.agents, 'Annotate.agent.md');
  if (fs.existsSync(agentFile)) {
    fs.unlinkSync(agentFile);
    console.log('  ✓ Removed agent: Annotate.agent.md');
  }
  
  // Remove skill directory
  const skillDir = path.join(manifest.files.skills, 'annotate');
  if (fs.existsSync(skillDir)) {
    removeDir(skillDir);
    console.log('  ✓ Removed skill: annotate');
  }
  
  // Delete manifest
  deleteManifest();
  
  console.log('');
  console.log('Uninstallation complete.');
}

/**
 * List installed version
 */
async function list() {
  const manifest = readManifest();
  
  if (!manifest) {
    console.log('Markdown Commenter is not installed.');
    console.log('');
    console.log('To install, run:');
    console.log('  npx @erdem-tuna/markdown-commenter install copilot');
    return;
  }
  
  console.log('Markdown Commenter Installation:');
  console.log(`  Version: ${manifest.version}`);
  console.log(`  Target: ${manifest.target}`);
  console.log(`  Installed: ${manifest.installedAt}`);
  console.log('');
  console.log('Files:');
  console.log(`  Agents: ${manifest.files.agents}`);
  console.log(`  Skills: ${manifest.files.skills}`);
}

/**
 * Show help
 */
function showHelp() {
  console.log('Markdown Commenter CLI');
  console.log('');
  console.log('Usage:');
  console.log('  markdown-commenter install copilot  Install to Copilot CLI');
  console.log('  markdown-commenter uninstall        Remove installation');
  console.log('  markdown-commenter list             Show installation info');
  console.log('  markdown-commenter help             Show this help');
  console.log('');
  console.log('After installation, the annotation skill is available in Copilot CLI.');
  console.log('Start with: @annotate <file.md>');
}

module.exports = {
  install,
  uninstall,
  list,
  showHelp,
  getTargetPaths,
  readManifest,
  writeManifest
};
