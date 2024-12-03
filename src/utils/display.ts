import chalk from 'chalk';
import { Package } from '../types/index.js';
import inquirer from 'inquirer';

export async function displayPackageDetailsWithActions(pkg: Package): Promise<'install' | 'uninstall' | 'open' | 'back' | 'exit'> {
  console.log('\n' + chalk.bold.cyan('Package Details:'));
  console.log(chalk.bold('Name:        ') + pkg.name);
  console.log(chalk.bold('Description: ') + pkg.description);
  console.log(chalk.bold('Vendor:      ') + pkg.vendor);
  console.log(chalk.bold('License:     ') + pkg.license);
  console.log(chalk.bold('Runtime:     ') + (pkg.runtime || 'node'));
  console.log(chalk.bold('Source:      ') + (pkg.sourceUrl || 'Not available'));
  console.log(chalk.bold('Homepage:    ') + (pkg.homepage || 'Not available'));

  const choices = [
    { name: pkg.isInstalled ? '🔄 Reinstall this package' : '📦 Install this package', value: 'install' },
    ...(pkg.isInstalled ? [{ name: '🗑️  Uninstall this package', value: 'uninstall' }] : []),
    ...(pkg.sourceUrl ? [{ name: '🔗 Open source URL', value: 'open' }] : []),
    { name: '⬅️  Back to list', value: 'back' },
    { name: '❌ Exit', value: 'exit' }
  ];

  const { action } = await inquirer.prompt<{ action: 'install' | 'uninstall' | 'open' | 'back' | 'exit' }>([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices
    }
  ]);

  return action;
} 