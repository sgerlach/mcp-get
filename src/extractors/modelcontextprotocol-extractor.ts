import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PackageInfo {
  name: string;
  description: string;
  vendor: string;
  sourceUrl: string;
  homepage: string;
  license: string;
}

export async function extractPackageInfo(): Promise<PackageInfo[]> {
  const tempDir = path.join(__dirname, '../../temp');
  const outputPath = path.join(__dirname, '../../packages/package-list.json');

  try {
    // Load existing packages
    let existingPackages: PackageInfo[] = [];
    if (fs.existsSync(outputPath)) {
      existingPackages = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Clone the repository
    console.log('Cloning repository...');
    await execAsync(
      'git clone https://github.com/modelcontextprotocol/servers.git temp',
      { cwd: path.join(__dirname, '../..') }
    );

    // Read all directories in src
    const srcPath = path.join(tempDir, 'src');
    const newPackages: PackageInfo[] = [];

    const dirs = fs.readdirSync(srcPath);
    
    for (const dir of dirs) {
      const packageJsonPath = path.join(srcPath, dir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const repoPath = `https://github.com/modelcontextprotocol/servers/blob/main/src/${dir}`;
        
        newPackages.push({
          name: packageData.name || '',
          description: packageData.description || '',
          vendor: packageData.author || '',
          sourceUrl: repoPath,
          homepage: packageData.homepage || '',
          license: packageData.license || ''
        });
      }
    }

    // Merge existing and new packages
    const mergedPackages = [...existingPackages];
    let hasChanges = false;
    
    for (const newPkg of newPackages) {
      const existingIndex = mergedPackages.findIndex(pkg => pkg.name === newPkg.name);
      if (existingIndex >= 0) {
        // Update existing package if there are changes
        if (JSON.stringify(mergedPackages[existingIndex]) !== JSON.stringify(newPkg)) {
          mergedPackages[existingIndex] = newPkg;
          hasChanges = true;
          console.log(`Updated package: ${newPkg.name}`);
        }
      } else {
        // Add new package
        mergedPackages.push(newPkg);
        hasChanges = true;
        console.log(`Added new package: ${newPkg.name}`);
      }
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('Temporary files cleaned up');

    return mergedPackages;

  } catch (error) {
    console.error('Error:', error);
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
} 