import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function getCurrentVersion(): Promise<string> {
  const packageJsonPath = new URL('../package.json', import.meta.url).pathname;
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

async function getLatestVersion(): Promise<string> {
  const { stdout } = await execAsync('npm show @michaellatman/mcp-get version');
  return stdout.trim();
}

export async function updatePackage(silent: boolean = false): Promise<void> {
  try {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();

    if (currentVersion !== latestVersion) {
      if (!silent) {
        console.log(chalk.yellow(`\nA new version of mcp-get is available: ${latestVersion} (current: ${currentVersion})`));
        console.log(chalk.cyan('Installing update...'));
      }

      try {
        await execAsync('npx --yes @michaellatman/mcp-get@latest');
        if (!silent) console.log(chalk.green('✓ Update complete\n'));
      } catch (installError: any) {
        if (!silent) console.error(chalk.red('Failed to install update:'), installError.message);
        return;
      }
    } else {
      if (!silent) console.log(chalk.green('✓ mcp-get is already up to date\n'));
    }
  } catch (error: any) {
    if (!silent) console.error(chalk.red('Failed to check for updates:'), error.message);
    return;
  }
}

