#!/usr/bin/env node

/**
 * Script to convert package-list.json to individual package files.
 * This script imports the helpers/index.ts directly to get environment variables.
 * 
 * Usage:
 *   node src/scripts/convert-packages.js             # Convert all packages
 *   node src/scripts/convert-packages.js packageName # Convert only the specified package
 * 
 * After conversion, the package is removed from package-list.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../');
const PACKAGE_LIST_PATH = path.join(ROOT_DIR, 'packages/package-list.json');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const HELPERS_TS_PATH = path.join(ROOT_DIR, 'src/helpers/index.ts');
const HELPERS_JS_PATH = path.join(ROOT_DIR, 'temp', 'helpers.js');

/**
 * Converts a package name to a safe filename
 */
function getPackageFilename(packageName) {
  return packageName.replace(/^@/, '').replace(/\//g, '--') + '.json';
}

/**
 * Creates a temporary JavaScript version of the helpers file
 * This makes it easier to import directly
 */
async function createTempHelpers() {
  // Ensure temp directory exists
  if (!fs.existsSync(path.join(ROOT_DIR, 'temp'))) {
    fs.mkdirSync(path.join(ROOT_DIR, 'temp'), { recursive: true });
  }
  
  // Read the TypeScript file
  const helpersTsContent = fs.readFileSync(HELPERS_TS_PATH, 'utf8');
  
  // Convert to JavaScript (simple conversion for our needs)
  const helpersJsContent = helpersTsContent
    .replace('import { PackageHelpers } from \'../types/index.js\';', '')
    .replace('export const packageHelpers: PackageHelpers =', 'export const packageHelpers =');
  
  // Write to temp file
  fs.writeFileSync(HELPERS_JS_PATH, helpersJsContent, 'utf8');
  
  // Run tsc on it to convert to valid JS
  try {
    await execAsync(`cd ${ROOT_DIR} && npx tsc --allowJs --outDir ./temp ./temp/helpers.js`);
    console.log('Helpers file converted to JavaScript');
  } catch (error) {
    console.error('Error converting helpers file:', error);
    // If transpilation fails, we'll still have the basic conversion
  }
}

/**
 * Gets the helper data
 */
async function getHelperData() {
  await createTempHelpers();
  
  try {
    // Dynamic import of the generated JS file
    const { packageHelpers } = await import(HELPERS_JS_PATH);
    
    if (!packageHelpers) {
      console.error('Could not load package helpers');
      return {};
    }
    
    return packageHelpers;
  } catch (error) {
    console.error('Error loading helper data:', error);
    
    // As a fallback, try to load it by parsing the file
    try {
      const helpersContent = fs.readFileSync(HELPERS_JS_PATH, 'utf8');
      const helpersObject = helpersContent.substring(
        helpersContent.indexOf('packageHelpers = {') + 'packageHelpers = '.length,
        helpersContent.lastIndexOf('};') + 1
      );
      
      // Replace single quotes with double quotes for JSON parsing
      const jsonObject = helpersObject
        .replace(/'/g, '"')
        .replace(/(\w+):/g, '"$1":');
      
      return JSON.parse(jsonObject);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return {};
    }
  }
}

/**
 * Extracts environment variables from package helper
 */
function getEnvironmentVariables(packageName, packageHelpers) {
  const helper = packageHelpers[packageName];
  if (!helper) return {};
  
  const envVars = helper.requiredEnvVars;
  if (!envVars) return {};
  
  return envVars;
}

/**
 * Main function to convert package list to individual files
 * 
 * @param {string} singlePackage - If provided, only convert this specific package
 */
async function convertPackages(singlePackage) {
  try {
    // Read the package list
    const packageListContent = fs.readFileSync(PACKAGE_LIST_PATH, 'utf8');
    const packageList = JSON.parse(packageListContent);
    
    // Get the helper data with environment variables
    const packageHelpers = await getHelperData();
    console.log(`Loaded helper data with ${Object.keys(packageHelpers).length} package entries`);
    
    // Create a backup of the original package list
    fs.copyFileSync(PACKAGE_LIST_PATH, `${PACKAGE_LIST_PATH}.bak`);
    console.log(`Created backup of package list: ${PACKAGE_LIST_PATH}.bak`);
    
    // Create the packages directory if it doesn't exist
    if (!fs.existsSync(PACKAGES_DIR)) {
      fs.mkdirSync(PACKAGES_DIR, { recursive: true });
    }
    
    // Keep track of which packages will be removed from the original list
    const packagesToRemove = [];
    
    // Filter the package list if a single package was specified
    const packagesToConvert = singlePackage
      ? packageList.filter(pkg => pkg.name === singlePackage)
      : packageList;
    
    if (singlePackage && packagesToConvert.length === 0) {
      console.error(`Package "${singlePackage}" not found in package-list.json`);
      process.exit(1);
    }
    
    // Convert each package to an individual file
    for (const pkg of packagesToConvert) {
      const packageName = pkg.name;
      
      // Get environment variables for this package
      const environmentVariables = getEnvironmentVariables(packageName, packageHelpers);
      
      // Create the complete package object
      const packageObject = {
        ...pkg,
        environmentVariables
      };
      
      // Write the package file
      const packageFilePath = path.join(PACKAGES_DIR, getPackageFilename(packageName));
      fs.writeFileSync(packageFilePath, JSON.stringify(packageObject, null, 2), 'utf8');
      
      console.log(`Created package file: ${packageFilePath}`);
      
      // Add to the list of packages to remove from the original package-list.json
      packagesToRemove.push(packageName);
      
      // Log environment variables
      const envVarCount = Object.keys(environmentVariables).length;
      if (envVarCount > 0) {
        console.log(`  - Added ${envVarCount} environment variables`);
        Object.keys(environmentVariables).forEach(varName => {
          console.log(`    - ${varName} (required: ${environmentVariables[varName].required})`);
        });
      }
    }
    
    // We no longer create an index file
    console.log("Individual package files created. No index file is needed as we'll scan the directory directly.");
    
    // Update the original package-list.json by removing the converted packages
    if (packagesToRemove.length > 0) {
      // Filter out the converted packages from the original package list
      const remainingPackages = packageList.filter(pkg => !packagesToRemove.includes(pkg.name));
      
      // Write the updated package list back to package-list.json
      fs.writeFileSync(PACKAGE_LIST_PATH, JSON.stringify(remainingPackages, null, 2), 'utf8');
      console.log(`\nRemoved ${packagesToRemove.length} packages from the original package-list.json`);
      console.log(`Remaining packages in package-list.json: ${remainingPackages.length}`);
    }
    
    console.log('\nConversion completed successfully!');
    console.log(`Total packages converted: ${packagesToRemove.length}`);
    
    // Clean up
    //fs.unlinkSync(HELPERS_JS_PATH);
    //console.log('Cleaned up temporary files');
    
  } catch (error) {
    console.error('Error converting packages:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const singlePackage = args[0]; // If provided, only convert this specific package

// Run the conversion with optional single package filter
convertPackages(singlePackage);