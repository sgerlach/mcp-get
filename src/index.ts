#!/usr/bin/env node

import { install } from './install.js';
import { list } from './list.js';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';
import { listInstalledPackages } from './installed';
import { uninstall } from './uninstall.js';

inquirer.registerPrompt('autocomplete', autocomplete);

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'install':
    const packageName = args[1];
    if (!packageName) {
      console.error('Please provide a package name.');
      process.exit(1);
    }
    install(packageName);
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
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
