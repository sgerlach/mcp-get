import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Package } from './types/index.js';
import { installMCPServer } from './utils/config.js';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
import { packageHelpers } from './helpers/index.js';
import chalk from 'chalk';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageListPath = join(__dirname, '../packages/package-list.json');

async function handlePackageHelper(packageName: string): Promise<Record<string, string> | undefined> {
  const helper = packageHelpers[packageName];
  if (!helper?.requiredEnvVars) return undefined;

  const envVars: Record<string, string> = {};
  console.log(chalk.cyan('\nEnvironment Variable Configuration:'));
  
  // First check if env vars are needed and get user confirmation
  console.log(chalk.yellow('\nThis package requires configuration of environment variables.'));
  const { proceed } = await inquirer.prompt<{ proceed: boolean }>([{
    type: 'confirm',
    name: 'proceed',
    message: 'Would you like to configure them now?',
    default: true
  }]);
  
  if (!proceed) {
    console.log(chalk.yellow('\nInstallation cancelled. Package requires environment configuration.'));
    process.exit(0);
  }
  
  for (const [envVar, config] of Object.entries(helper.requiredEnvVars)) {
    const envConfig = config as { description: string; required: boolean; default?: string };
    const existingValue = process.env[envVar];
    
    console.log(chalk.gray(`\n${envVar}:`));
    console.log(chalk.gray(`Description: ${envConfig.description}`));
    if (envConfig.default) {
      console.log(chalk.gray(`Default: ${envConfig.default}`));
    }
    
    if (existingValue) {
      const { useExisting } = await inquirer.prompt<{ useExisting: boolean }>([{
        type: 'confirm',
        name: 'useExisting',
        message: `Found existing ${envVar} in environment. Use this value?`,
        default: true
      }]);
      
      if (useExisting) {
        envVars[envVar] = existingValue;
        console.log(chalk.green(`Using existing ${envVar}`));
        continue;
      }
    }

    const { configure } = await inquirer.prompt([{
      type: 'confirm',
      name: 'configure',
      message: `Would you like to configure ${envVar}${envConfig.required ? ' (required)' : ' (optional)'}?`,
      default: envConfig.required
    }]);

    if (configure) {
      const { value } = await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: `Enter value for ${envVar}:`,
        default: envConfig.default,
        validate: (input) => {
          if (envConfig.required && !input) {
            return `${envVar} is required`;
          }
          return true;
        }
      }]);
      
      if (value) {
        envVars[envVar] = value;
        console.log(chalk.green(`✓ ${envVar} configured`));
      }
    } else if (envConfig.required) {
      console.log(chalk.yellow(`\n⚠️  Warning: ${envVar} is required but not configured. You'll need to set it manually.`));
      process.exit(0);
    }
  }
  
  return Object.keys(envVars).length > 0 ? envVars : undefined;
}

export async function installPackage(pkg: Package | string): Promise<void> {
  try {
    const packageName = typeof pkg === 'string' ? pkg : pkg.name;
    
    // Handle package-specific configuration and get environment variables
    const env = await handlePackageHelper(packageName);
    
    // After successful installation, update the config with env variables
    installMCPServer(packageName, env);
    console.log('Updated Claude desktop configuration');
    
    // Prompt user about restarting Claude
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
        // Kill existing Claude process
        await execAsync('pkill -x Claude || true');
        // Wait 2 seconds before restarting
        console.log('Waiting for Claude to close...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Start Claude again
        await execAsync('open -a Claude');
        console.log('Claude desktop app has been restarted');
      } catch (error) {
        console.warn('Failed to restart Claude desktop app automatically. Please restart it manually.');
      }
    } else {
      console.log('Please restart the Claude desktop app manually to apply changes.');
    }
    
  } catch (error) {
    console.error('Failed to install package:', error);
    throw error;
  }
}

export async function install(packageName: string): Promise<void> {
  const packageList: Package[] = JSON.parse(readFileSync(packageListPath, 'utf-8'));

  const pkg = packageList.find(p => p.name === packageName);
  if (!pkg) {
    console.warn(`Package ${packageName} not found in the curated list.`);
    
    const { proceedWithInstall } = await inquirer.prompt<{ proceedWithInstall: boolean }>([
      {
        type: 'confirm',
        name: 'proceedWithInstall',
        message: `Would you like to try installing ${packageName} anyway? This package hasn't been verified.`,
        default: false
      }
    ]);

    if (proceedWithInstall) {
      console.log(`Proceeding with installation of ${packageName}...`);
      await installPackage(packageName);
    } else {
      console.log('Installation cancelled.');
      process.exit(1);
    }
    return;
  }

  await installPackage(pkg);
}
