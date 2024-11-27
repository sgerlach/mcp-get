import inquirer from 'inquirer';
import { uninstallPackage } from './utils/package-management';

export async function uninstall(packageName: string): Promise<void> {
  try {
    const { confirmUninstall } = await inquirer.prompt<{ confirmUninstall: boolean }>([
      {
        type: 'confirm',
        name: 'confirmUninstall',
        message: `Are you sure you want to uninstall ${packageName}?`,
        default: false
      }
    ]);

    if (confirmUninstall) {
      await uninstallPackage(packageName);
      console.log(`Successfully uninstalled ${packageName}`);
    } else {
      console.log('Uninstallation cancelled.');
    }
  } catch (error) {
    console.error('Failed to uninstall package:', error);
    throw error;
  }
} 