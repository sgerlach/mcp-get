import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

async function getCurrentVersion(): Promise<string> {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  return packageJson.version;
}

async function getLatestVersion(): Promise<string> {
  const { stdout } = await execAsync('npm show @michaellatman/mcp-get version');
  return stdout.trim();
}

async function updatePackage(): Promise<void> {
  const currentVersion = await getCurrentVersion();
  const latestVersion = await getLatestVersion();

  if (currentVersion !== latestVersion) {
    console.log(`Updating @michaellatman/mcp-get from version ${currentVersion} to ${latestVersion}`);
    await execAsync('npm install -g @michaellatman/mcp-get');
    console.log('Update complete.');
  } else {
    console.log('@michaellatman/mcp-get is already up to date.');
  }
}

export { updatePackage };
