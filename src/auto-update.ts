import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function getCurrentVersion(): Promise<string> {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  return packageJson.version;
}

async function getLatestVersion(): Promise<string> {
  const { stdout } = await execAsync('npm show @michaellatman/mcp-get version');
  return stdout.trim();
}

export async function updatePackage(): Promise<void> {
  try {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();

    if (currentVersion !== latestVersion) {
      console.log(chalk.yellow(`\nA new version of mcp-get is available: ${latestVersion} (current: ${currentVersion})`));
      console.log(chalk.cyan('Installing update...'));
      
      // Use npx to ensure we get the latest version
      await execAsync('npx --yes @michaellatman/mcp-get@latest');
      
      console.log(chalk.green('✓ Update complete\n'));
      
      // Exit after update to ensure the new version is used
      process.exit(0);
    }
  } catch (error) {
    // Log update check failure but continue with execution
    console.log(chalk.yellow('\nFailed to check for updates. Continuing with current version.'));
  }
}

