import * as fs from 'fs';
import * as path from 'path';

const packageListPath = path.join(__dirname, '../packages/package-list.json');

export function list() {
  fs.readFile(packageListPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading package list:', err);
      process.exit(1);
    }

    const packages = JSON.parse(data);
    console.log('Available packages:');
    packages.forEach((pkg: any) => {
      console.log(`- ${pkg.name}: ${pkg.description} (Vendor: ${pkg.vendor}, License: ${pkg.license})`);
    });
  });
}
