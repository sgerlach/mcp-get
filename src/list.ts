import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { displayPackageDetailsWithActions } from './utils/display.js';
import { installPackage, uninstallPackage, resolvePackages, ResolvedPackage } from './utils/package-management.js';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';

// Register the autocomplete prompt
inquirer.registerPrompt('autocomplete', AutocompletePrompt);

export async function list() {
  try {
    const packages = resolvePackages();
    console.log(chalk.bold.cyan('\n📦 Available Packages'));
    console.log(chalk.gray(`Found ${packages.length} packages\n`));

    // Prepare choices for inquirer using table-like format
    const choices = packages.map((pkg) => ({
      name: `${pkg.isInstalled ? '✓ ' : '  '}${pkg.name.padEnd(22)} │ ${
        pkg.description.length > 47 ? `${pkg.description.slice(0, 44)}...` : pkg.description.padEnd(49)
      } │ ${pkg.vendor.padEnd(19)} │ ${pkg.license.padEnd(14)}`,
      value: pkg,
      short: pkg.name
    }));

    const answer = await inquirer.prompt<{ selectedPackage: ResolvedPackage }>([
      {
        type: 'autocomplete',
        name: 'selectedPackage',
        message: 'Search and select a package:',
        source: async (_answersSoFar: any, input: string) => {
          if (!input) return choices;

          return fuzzy
            .filter(input.toLowerCase(), choices, {
              extract: (choice) => `${choice.value.name} ${choice.value.description} ${choice.value.vendor}`.toLowerCase()
            })
            .map(result => result.original);
        },
        pageSize: 10
      }
    ]);

    if (!answer.selectedPackage) {
      return;
    }

    await handleSelectedPackage(answer.selectedPackage);
  } catch (error) {
    console.error(chalk.red('Error loading package list:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function handleSelectedPackage(pkg: ResolvedPackage) {
  const action = await displayPackageDetailsWithActions(pkg);
  
  switch (action) {
    case 'install':
      console.log(chalk.cyan(`\nPreparing to install ${pkg.name}...`));
      await installPackage(pkg);
      pkg.isInstalled = true;
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
        pkg.isInstalled = false;
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
  await handleSelectedPackage(pkg);
}
