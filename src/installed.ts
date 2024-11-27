import inquirer from 'inquirer';
import { readConfig, writeConfig } from './utils/config';
import { formatPackageInfo } from './utils/display';
import { uninstallPackage } from './utils/package-management';

export async function listInstalledPackages(): Promise<void> {
  const config = readConfig();
  const installedServers = config.mcpServers || {};
  const serverNames = Object.keys(installedServers);

  if (serverNames.length === 0) {
    console.log('No MCP servers are currently installed.');
    return;
  }

  console.log('Installed MCP servers:\n');
  serverNames.forEach(name => {
    console.log(`- ${name}`);
  });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Uninstall a server', value: 'uninstall' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);

  if (action === 'uninstall') {
    const { packageToUninstall } = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageToUninstall',
        message: 'Select a server to uninstall:',
        choices: serverNames
      }
    ]);

    const { confirmUninstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmUninstall',
        message: `Are you sure you want to uninstall ${packageToUninstall}?`,
        default: false
      }
    ]);

    if (confirmUninstall) {
      await uninstallPackage(packageToUninstall);
    } else {
      console.log('Uninstallation cancelled.');
    }
  }
} 