import inquirer from 'inquirer';
import { Package } from '../types';
import { getConfigPath, installMCPServer, readConfig, writeConfig } from './config.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { packageHelpers } from '../helpers/index.js';

const execAsync = promisify(exec);

async function promptForEnvVars(packageName: string): Promise<Record<string, string> | undefined> {
  const helpers = packageHelpers[packageName];
  if (!helpers?.requiredEnvVars) {
    return undefined;
  }

  // Check if all required variables exist in environment
  const existingEnvVars: Record<string, string> = {};
  let hasAllRequired = true;
  
  for (const [key, value] of Object.entries(helpers.requiredEnvVars)) {
    const existingValue = process.env[key];
    if (existingValue) {
      existingEnvVars[key] = existingValue;
    } else if (value.required) {
      hasAllRequired = false;
    }
  }

  if (hasAllRequired && Object.keys(existingEnvVars).length > 0) {
    const { useAutoSetup } = await inquirer.prompt<{ useAutoSetup: boolean }>([{
      type: 'confirm',
      name: 'useAutoSetup',
      message: 'Found all required environment variables. Would you like to use them automatically?',
      default: true
    }]);

    if (useAutoSetup) {
      return existingEnvVars;
    }
  }

  const { configureEnv } = await inquirer.prompt<{ configureEnv: boolean }>([{
    type: 'confirm',
    name: 'configureEnv',
    message: hasAllRequired 
      ? 'Would you like to manually configure environment variables for this package?'
      : 'Some required environment variables are missing. Would you like to configure them now?',
    default: !hasAllRequired
  }]);

  if (!configureEnv) {
    if (!hasAllRequired) {
      const configPath = getConfigPath();
      console.log('\nNote: Some required environment variables are not configured.');
      console.log(`You can set them later by editing the config file at:`);
      console.log(configPath);
    }
    return undefined;
  }

  const envVars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(helpers.requiredEnvVars)) {
    const existingEnvVar = process.env[key];
    
    if (existingEnvVar) {
      const { reuseExisting } = await inquirer.prompt<{ reuseExisting: boolean }>([{
        type: 'confirm',
        name: 'reuseExisting',
        message: `Found ${key} in your environment variables. Would you like to use it?`,
        default: true
      }]);

      if (reuseExisting) {
        envVars[key] = existingEnvVar;
        continue;
      }
    }

    const { envValue } = await inquirer.prompt([{
      type: 'input',
      name: 'envValue',
      message: `Please enter ${value.description}:`,
      default: value.required ? undefined : null,
      validate: (input: string) => {
        if (value.required && !input) {
          return `${key} is required`;
        }
        return true;
      }
    }]);

    if (envValue !== null) {
      envVars[key] = envValue;
    }
  }

  if (Object.keys(envVars).length === 0) {
    const configPath = getConfigPath();
    console.log('\nNo environment variables were configured.');
    console.log(`You can set them later by editing the config file at:`);
    console.log(configPath);
    return undefined;
  }

  return envVars;
}

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
    const envVars = await promptForEnvVars(pkg.name);
    
    installMCPServer(pkg.name, envVars);
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
