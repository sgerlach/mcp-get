#!/usr/bin/env node

import { install } from './install.js';
import { list } from './list.js';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';
import { listInstalledPackages } from './installed.js';
import { uninstall } from './uninstall.js';
import { updatePackage } from './auto-update.js';
import chalk from 'chalk';

inquirer.registerPrompt('autocomplete', autocomplete);

const args = process.argv.slice(2);
const command = args[0];

const skipUpdateCommands = ['update', 'version', 'help'];

function displayHelp() {
  console.log(chalk.bold.cyan('\nMCP-Get - Model Context Protocol Package Manager\n'));
  console.log('Usage: mcp-get <command>\n');
  console.log('Commands:');
  console.log('  install <package>  Install a package');
  console.log('  uninstall <package>  Uninstall a package');
  console.log('  ls, list          List available packages');
  console.log('  installed         List installed packages');
  console.log('  update           Update mcp-get to the latest version');
  console.log('  help             Display this help message\n');
  console.log('Examples:');
  console.log('  mcp-get install @modelcontextprotocol/server-brave-search');
  console.log('  mcp-get ls');
  console.log('  mcp-get installed\n');
  console.log('For more information, visit: https://modelcontextprotocol.io\n');
}

async function main() {
  try {
    if (!skipUpdateCommands.includes(command)) {
      await updatePackage();
    }

    switch (command) {
      case undefined:
      case 'help':
        displayHelp();
        break;
      case 'install':
        const packageName = args[1];
        if (!packageName) {
          console.error('Please provide a package name.');
          process.exit(1);
        }
        await install(packageName);
        break;
      case 'uninstall':
        const pkgToUninstall = args[1];
        if (!pkgToUninstall) {
          console.error('Please provide a package name to uninstall.');
          process.exit(1);
        }
        uninstall(pkgToUninstall);
        break;
      case 'ls':
      case 'list':
        list();
        break;
      case 'installed':
        listInstalledPackages();
        break;
      case 'update':
        await updatePackage();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
