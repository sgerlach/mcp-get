import inquirer from 'inquirer';
import chalk from 'chalk';
import { readConfig } from './utils/config';
import { displayPackageDetailsWithActions } from './utils/display';
import { uninstallPackage } from './utils/package-management';
import { Package } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import fuzzy from 'fuzzy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageListPath = join(__dirname, '../packages/package-list.json');

inquirer.registerPrompt('autocomplete', AutocompletePrompt);

export async function listInstalledPackages(): Promise<void> {
  // Read full package list
  const allPackages: Package[] = JSON.parse(readFileSync(packageListPath, 'utf-8'));
  
  // Get installed packages from config
  const config = readConfig();
  const installedServers = config.mcpServers || {};
  const serverNames = Object.keys(installedServers);

  if (serverNames.length === 0) {
    console.log(chalk.yellow('\nNo MCP servers are currently installed.'));
    return;
  }

  // Filter for only installed packages
  const installedPackages = allPackages.filter(pkg => 
    serverNames.includes(pkg.name.replace(/\//g, '-'))
  );

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

  const answer = await inquirer.prompt<{ selectedPackage: Package }>([
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

  const displayPackages = answer.selectedPackage ? [answer.selectedPackage] : installedPackages;

  if (displayPackages.length === 0) {
    console.log(chalk.yellow('\nNo packages found matching your search.'));
    return;
  }

  console.log(chalk.bold.white(`\nShowing ${displayPackages.length} package(s):`));
  displayPackages.forEach(displayPackageDetailsWithActions);

  if (displayPackages.length === 1) {
    const pkg = displayPackages[0];
    await handleSelectedPackage(pkg);
  }
}

async function handleSelectedPackage(pkg: Package) {
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