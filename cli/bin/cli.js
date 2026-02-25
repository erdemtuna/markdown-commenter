#!/usr/bin/env node

/**
 * Markdown Commenter CLI
 * 
 * Install Copilot skill and agent for markdown annotation workflow.
 * 
 * Usage:
 *   npx @erdem-tuna/markdown-commenter install copilot
 *   npx @erdem-tuna/markdown-commenter uninstall
 *   npx @erdem-tuna/markdown-commenter list
 */

const { install, uninstall, list, showHelp } = require('../lib/installer.js');

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

async function main() {
  try {
    switch (command) {
      case 'install':
        if (!target || target !== 'copilot') {
          console.error('Usage: markdown-commenter install copilot');
          console.error('');
          console.error('Supported targets:');
          console.error('  copilot - Install to GitHub Copilot CLI (~/.copilot/)');
          process.exit(1);
        }
        await install(target);
        break;
        
      case 'uninstall':
        await uninstall();
        break;
        
      case 'list':
        await list();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        if (command) {
          console.error(`Unknown command: ${command}`);
        }
        showHelp();
        process.exit(command ? 1 : 0);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
