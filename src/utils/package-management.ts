import inquirer from 'inquirer';
import { Package } from '../types';
import { installMCPServer, readConfig, writeConfig } from './config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function promptForRestart(): Promise<boolean> {
  const { shouldRestart } = await inquirer.prompt<{ shouldRestart: boolean }>([
    {
      type: 'confirm',
      name: 'shouldRestart',
      message: 'Would you like to restart the Claude desktop app to apply changes?',
      default: true
    }
  ]);
  
  if (shouldRestart) {
    console.log('Restarting Claude desktop app...');
    try {
      const platform = process.platform;
      if (platform === 'win32') {
        await execAsync('taskkill /F /IM "Claude.exe" && start "" "Claude.exe"');
      } else if (platform === 'darwin') {
        await execAsync('killall "Claude" && open -a "Claude"');
      } else if (platform === 'linux') {
        await execAsync('pkill -f "claude" && claude');
      }

      // Wait a moment for the app to close before reopening
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reopen the app
      if (platform === 'win32') {
        await execAsync('start "" "Claude.exe"');
      } else if (platform === 'darwin') {
        await execAsync('open -a "Claude"');
      } else if (platform === 'linux') {
        await execAsync('claude');
      }

      console.log('Claude desktop app has been restarted.');
    } catch (error) {
      console.error('Failed to restart Claude desktop app:', error);
    }
  }
  
  return shouldRestart;
}

export async function installPackage(pkg: Package): Promise<void> {
  try {
    installMCPServer(pkg.name);
    console.log('Updated Claude desktop configuration');
    await promptForRestart();
  } catch (error) {
    console.error('Failed to install package:', error);
    throw error;
  }
}

export async function uninstallPackage(packageName: string): Promise<void> {
  try {
    const config = readConfig();
    // Sanitize package name the same way as installation
    const serverName = packageName.replace(/\//g, '-');
    
    if (!config.mcpServers || !config.mcpServers[serverName]) {
      console.log(`Package ${packageName} is not installed.`);
      return;
    }
    
    delete config.mcpServers[serverName];
    writeConfig(config);
    console.log(`\nUninstalled ${packageName}`);
    await promptForRestart();
  } catch (error) {
    console.error('Failed to uninstall package:', error);
    throw error;
  }
} 