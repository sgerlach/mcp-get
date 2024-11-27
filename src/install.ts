import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Package } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageListPath = join(__dirname, '../packages/package-list.json');

export async function installPackage(pkg: Package): Promise<void> {
  console.log(`Installing package: ${pkg.name}`);
  console.log(`Description: ${pkg.description}`);
  console.log(`Vendor: ${pkg.vendor}`);
  console.log(`Source URL: ${pkg.sourceUrl}`);
  console.log(`License: ${pkg.license}`);

  // Here you can add the logic to download and install the package from the sourceUrl
}

export async function install(packageName: string): Promise<void> {
  const packageList: Package[] = JSON.parse(readFileSync(packageListPath, 'utf-8'));

  const pkg = packageList.find(p => p.name === packageName);
  if (!pkg) {
    console.error(`Package ${packageName} not found.`);
    process.exit(1);
  }

  await installPackage(pkg);
}
