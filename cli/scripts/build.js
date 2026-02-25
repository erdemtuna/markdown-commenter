/**
 * Build script for CLI distribution
 * 
 * Processes agent conditional blocks for CLI environment and copies
 * skills and agents to dist/ directory.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const CLI_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(CLI_DIR, 'dist');

/**
 * Process conditional blocks in content
 * Keeps CLI blocks, removes VS Code blocks
 */
function processConditionalBlocks(content) {
  let result = content;
  
  // Keep cli content (remove tags only)
  result = result.replace(/\{\{#cli\}\}\n?/g, '');
  result = result.replace(/\{\{\/cli\}\}\n?/g, '');
  
  // Remove vscode content entirely
  result = result.replace(/\{\{#vscode\}\}[\s\S]*?\{\{\/vscode\}\}\n?/g, '');
  
  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

/**
 * Copy file with optional content processing
 */
function copyFile(src, dest, process = false) {
  let content = fs.readFileSync(src, 'utf-8');
  
  if (process) {
    content = processConditionalBlocks(content);
  }
  
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest, processFiles = false) {
  fs.mkdirSync(dest, { recursive: true });
  
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, processFiles);
    } else {
      copyFile(srcPath, destPath, processFiles && entry.name.endsWith('.md'));
    }
  }
}

/**
 * Build the distribution
 */
function build() {
  console.log('Building CLI distribution...');
  
  // Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  
  // Copy and process agents
  const agentsSrc = path.join(ROOT_DIR, 'agents');
  const agentsDest = path.join(DIST_DIR, 'agents');
  
  if (fs.existsSync(agentsSrc)) {
    fs.mkdirSync(agentsDest, { recursive: true });
    
    for (const file of fs.readdirSync(agentsSrc)) {
      if (file.endsWith('.agent.md')) {
        const src = path.join(agentsSrc, file);
        const dest = path.join(agentsDest, file);
        copyFile(src, dest, true);
        console.log(`  ✓ Processed agent: ${file}`);
      }
    }
  }
  
  // Copy skills (no processing needed for SKILL.md)
  const skillsSrc = path.join(ROOT_DIR, 'skills');
  const skillsDest = path.join(DIST_DIR, 'skills');
  
  if (fs.existsSync(skillsSrc)) {
    copyDir(skillsSrc, skillsDest, false);
    console.log('  ✓ Copied skills');
  }
  
  console.log('');
  console.log('Build complete!');
  console.log(`Output: ${DIST_DIR}`);
}

// Run if executed directly
if (require.main === module) {
  build();
}

module.exports = { build, processConditionalBlocks };
