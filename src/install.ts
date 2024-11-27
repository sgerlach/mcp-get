import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Package } from './types/index.js';
import { installMCPServer } from './utils/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageListPath = join(__dirname, '../packages/package-list.json');

export async function installPackage(packageName: string): Promise<void> {
  try {
    console.log(`Installing package: ${packageName}`);
    console.log(`Description: ${packageName}`);
    console.log(`Vendor: ${packageName}`);
    console.log(`Source URL: ${packageName}`);
    console.log(`License: ${packageName}`);

    // Here you can add the logic to download and install the package from the sourceUrl

    // After successful installation, update the config
    if (packageName.startsWith('@modelcontextprotocol/server-')) {
      installMCPServer(packageName);
      console.log('Updated Claude desktop configuration');
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
    console.error(`Package ${packageName} not found.`);
    process.exit(1);
  }

  await installPackage(pkg.name);
}
