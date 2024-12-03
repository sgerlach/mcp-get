import { exec } from 'child_process';
import { promisify } from 'util';
import inquirer from 'inquirer';
import chalk from 'chalk';

const execAsync = promisify(exec);

export async function checkUVInstalled(): Promise<boolean> {
  try {
    await execAsync('uvx --version');
    return true;
  } catch (error) {
    return false;
  }
}

export async function promptForUVInstall(inquirerInstance: typeof inquirer): Promise<boolean> {
  const { shouldInstall } = await inquirerInstance.prompt<{ shouldInstall: boolean }>([{
    type: 'confirm',
    name: 'shouldInstall',
    message: 'UV package manager is required for Python MCP servers. Would you like to install it?',
    default: true
  }]);

  if (!shouldInstall) {
    console.warn(chalk.yellow('UV installation was declined. You can install it manually from https://astral.sh/uv'));
    return false;
  }

  console.log('Installing uv package manager...');
  try {
    await execAsync('curl -LsSf https://astral.sh/uv/install.sh | sh');
    console.log(chalk.green('✓ UV installed successfully'));
    return true;
  } catch (error) {
    console.warn(chalk.yellow('Failed to install UV. You can install it manually from https://astral.sh/uv'));
    return false;
  }
} 