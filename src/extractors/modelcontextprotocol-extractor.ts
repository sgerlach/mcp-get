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
  const commitMsgPath = path.join(__dirname, '../../temp/commit-msg.txt');

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

    // Initialize commit message
    let commitMsg = "chore(packages): update MCP package list\n\nChanges:\n";
    let changes: string[] = [];

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
          const oldPkg = mergedPackages[existingIndex];
          mergedPackages[existingIndex] = newPkg;
          hasChanges = true;
          console.log(`Updated package: ${newPkg.name}`);
          
          // Add detailed change information
          const changeDetails = [];
          if (oldPkg.description !== newPkg.description) changeDetails.push('description');
          if (oldPkg.vendor !== newPkg.vendor) changeDetails.push('vendor');
          if (oldPkg.license !== newPkg.license) changeDetails.push('license');
          if (oldPkg.homepage !== newPkg.homepage) changeDetails.push('homepage');
          if (oldPkg.sourceUrl !== newPkg.sourceUrl) changeDetails.push('sourceUrl');
          
          changes.push(`- Updated ${newPkg.name} (changed: ${changeDetails.join(', ')})`);
        }
      } else {
        // Add new package
        mergedPackages.push(newPkg);
        hasChanges = true;
        console.log(`Added new package: ${newPkg.name}`);
        changes.push(`- Added new package: ${newPkg.name}`);
      }
    }

    // Write updated packages to file if there are changes
    if (hasChanges) {
      fs.writeFileSync(outputPath, JSON.stringify(mergedPackages, null, 2));
      console.log('Package list updated successfully');
      
      // Write commit message
      if (changes.length === 0) {
        changes.push('- Initial package list creation');
      }
      commitMsg += changes.join('\n');
      fs.writeFileSync(commitMsgPath, commitMsg);
      console.log('Commit message generated');
    } else {
      console.log('No changes detected in package list');
    }

    // Cleanup (but keep commit-msg.txt if it exists)
    const filesToKeep = new Set(['commit-msg.txt']);
    for (const file of fs.readdirSync(tempDir)) {
      if (!filesToKeep.has(file)) {
        const filePath = path.join(tempDir, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
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

// Run the function if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  extractPackageInfo()
    .then(() => console.log('Package extraction completed'))
    .catch(error => {
      console.error('Failed to extract packages:', error);
      process.exit(1);
    });
}