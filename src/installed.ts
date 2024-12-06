import inquirer from 'inquirer';
import chalk from 'chalk';
import { readConfig } from './utils/config.js';
import { displayPackageDetailsWithActions } from './utils/display.js';
import { uninstallPackage, resolvePackages, ResolvedPackage } from './utils/package-management.js';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import fuzzy from 'fuzzy';

inquirer.registerPrompt('autocomplete', AutocompletePrompt);

export async function listInstalledPackages(): Promise<void> {
  // Get all packages with their resolved status
  const allPackages = resolvePackages();
  
  // Filter for only installed packages
  const installedPackages = allPackages.filter(pkg => pkg.isInstalled);

  if (installedPackages.length === 0) {
    console.log(chalk.yellow('\nNo MCP servers are currently installed.'));
    return;
  }

  console.log(chalk.bold.cyan('\n📦 Installed Packages'));
  console.log(chalk.gray(`Found ${installedPackages.length} installed packages\n`));

  // Prepare choices for inquirer using table-like format
  const choices = installedPackages.map(pkg => ({
    name: `${pkg.name.padEnd(24)} │ ${
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
}

async function handleSelectedPackage(pkg: ResolvedPackage) {
  const action = await displayPackageDetailsWithActions(pkg);
  
  switch (action) {
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
        // Return to installed packages list
        await listInstalledPackages();
      } else {
        console.log('Uninstallation cancelled.');
        // Show actions again
        await handleSelectedPackage(pkg);
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
      // Show actions again after opening URL
      await handleSelectedPackage(pkg);
      break;
    case 'back':
      await listInstalledPackages();
      return;
    case 'exit':
      process.exit(0);
  }
} 