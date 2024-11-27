import inquirer from 'inquirer';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Package } from './types';
import { uninstallPackage } from './utils/package-management.js';
import { displayPackageDetailsWithActions } from './utils/display.js';
import { list } from './list.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageListPath = join(__dirname, '../packages/package-list.json');

export async function uninstall(packageName?: string): Promise<void> {
  try {
    const packageList: Package[] = JSON.parse(readFileSync(packageListPath, 'utf-8'));
    let selectedPackage: Package | undefined;

    if (packageName) {
      selectedPackage = packageList.find(p => p.name === packageName);
      if (!selectedPackage) {
        console.log(chalk.yellow(`Package ${packageName} not found in the package list.`));
        return;
      }
    } else {
      // Use same selection interface as list command
      const choices = packageList.map((pkg, index) => ({
        name: `${pkg.name.padEnd(24)} │ ${
          pkg.description.length > 47 ? `${pkg.description.slice(0, 44)}...` : pkg.description.padEnd(49)
        } │ ${pkg.vendor.padEnd(19)} │ ${pkg.license.padEnd(14)}`,
        value: pkg,
        short: pkg.name
      }));

      const { selectedPkg } = await inquirer.prompt<{ selectedPkg: Package }>([
        {
          type: 'autocomplete',
          name: 'selectedPkg',
          message: 'Select a package to uninstall:',
          source: async (_answersSoFar: any, input: string) => {
            if (!input) return choices;
            return choices.filter(choice => 
              choice.value.name.toLowerCase().includes(input.toLowerCase()) ||
              choice.value.description.toLowerCase().includes(input.toLowerCase())
            );
          },
          pageSize: 10
        }
      ]);
      selectedPackage = selectedPkg;
    }

    if (selectedPackage) {
      const action = await displayPackageDetailsWithActions(selectedPackage);
      await handlePackageAction(action, selectedPackage);
    }
  } catch (error) {
    console.error('Failed to uninstall package:', error);
    throw error;
  }
}

async function handlePackageAction(action: string, pkg: Package) {
  switch (action) {
    case 'install':
      // Import and call install function
      const { installPackage } = await import('./install');
      await installPackage(pkg);
      break;
    case 'uninstall':
      const { confirmUninstall } = await inquirer.prompt<{ confirmUninstall: boolean }>([
        {
          type: 'confirm',
          name: 'confirmUninstall',
          message: `Are you sure you want to uninstall ${pkg.name}?`,
          default: false
        }
      ]);
      
      if (confirmUninstall) {
        await uninstallPackage(pkg.name);
        console.log(chalk.green(`Successfully uninstalled ${pkg.name}`));
      } else {
        console.log('Uninstallation cancelled.');
      }
      break;
    case 'open':
      if (pkg.sourceUrl) {
        const open = (await import('open')).default;
        await open(pkg.sourceUrl);
        console.log(chalk.green(`\nOpened ${pkg.sourceUrl} in your browser`));
      } else {
        console.log(chalk.yellow('\nNo source URL available for this package'));
      }
      break;
    case 'back':
      await list();
      return;
    case 'exit':
      process.exit(0);
  }
  
  // Show actions again after completing an action (except for exit/back)
  const nextAction = await displayPackageDetailsWithActions(pkg);
  await handlePackageAction(nextAction, pkg);
} 