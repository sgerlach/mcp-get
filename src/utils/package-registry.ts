/**
 * Package Registry utility to load and manage MCP packages from the registry
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Package } from '../types/package.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const PACKAGES_DIR = path.join(__dirname, '../../packages');
const OLD_PACKAGE_LIST_PATH = path.join(PACKAGES_DIR, 'package-list.json');

/**
 * Converts a package name to a safe filename
 */
function getPackageFilename(packageName: string): string {
  return packageName.replace(/^@/, '').replace(/\//g, '--');
}

/**
 * Loads a single package from the registry
 * 
 * @param packageName The name of the package to load
 * @returns The package object or undefined if not found
 */
export function loadPackage(packageName: string): Package | undefined {
  const safeFilename = getPackageFilename(packageName);
  const packagePath = path.join(PACKAGES_DIR, `${safeFilename}.json`);
  
  try {
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      return JSON.parse(packageContent);
    }
    
    // Fallback to old package list if registry file doesn't exist
    if (fs.existsSync(OLD_PACKAGE_LIST_PATH)) {
      const packageListContent = fs.readFileSync(OLD_PACKAGE_LIST_PATH, 'utf-8');
      const packageList = JSON.parse(packageListContent);
      return packageList.find((pkg: Package) => pkg.name === packageName);
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error loading package ${packageName}:`, error);
    return undefined;
  }
}

/**
 * Loads all packages from the registry
 * 
 * @returns Array of package objects
 */
export function loadAllPackages(): Package[] {
  try {
    // Check if the packages directory exists
    if (fs.existsSync(PACKAGES_DIR)) {
      // Scan all JSON files in the directory
      const files = fs.readdirSync(PACKAGES_DIR)
        .filter(file => file.endsWith('.json') && file !== 'package-list.json');
      
      // Load each package file
      const packages: Package[] = [];
      
      for (const file of files) {
        try {
          const filePath = path.join(PACKAGES_DIR, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const pkg = JSON.parse(fileContent);
          
          // Only add valid packages with a name
          if (pkg && pkg.name) {
            packages.push(pkg);
          }
        } catch (err) {
          // Skip invalid files
          console.warn(`Could not load package from ${file}:`, err);
        }
      }
      
      return packages;
    }
    
    // Fallback to old package list if registry doesn't exist
    if (fs.existsSync(OLD_PACKAGE_LIST_PATH)) {
      const packageListContent = fs.readFileSync(OLD_PACKAGE_LIST_PATH, 'utf-8');
      return JSON.parse(packageListContent);
    }
    
    console.warn('No package registry found. Returning empty array.');
    return [];
  } catch (error) {
    console.error('Error loading all packages:', error);
    return [];
  }
}

/**
 * Gets the required environment variables for a package from its registry entry
 * 
 * @param packageName The name of the package
 * @returns Object containing the required environment variables or empty object if not found
 */
export function getPackageEnvironmentVariables(packageName: string): Record<string, any> {
  const pkg = loadPackage(packageName);
  
  if (pkg && pkg.environmentVariables) {
    return pkg.environmentVariables;
  }
  
  // If package doesn't have environment variables in registry, return empty object
  return {};
}

/**
 * Finds packages matching a search query
 * 
 * @param query The search query
 * @returns Array of matching packages
 */
export function searchPackages(query: string): Package[] {
  const packages = loadAllPackages();
  const lowerQuery = query.toLowerCase();
  
  return packages.filter(pkg => {
    return (
      pkg.name.toLowerCase().includes(lowerQuery) ||
      pkg.description.toLowerCase().includes(lowerQuery) ||
      pkg.vendor.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Updates a package in the registry
 * 
 * @param packageObj The package object to update
 * @returns boolean indicating success
 */
export function updatePackage(packageObj: Package): boolean {
  if (!packageObj.name) {
    console.error('Package object must have a name');
    return false;
  }
  
  try {
    const safeFilename = getPackageFilename(packageObj.name);
    const packagePath = path.join(PACKAGES_DIR, `${safeFilename}.json`);
    
    // Create packages directory if it doesn't exist
    if (!fs.existsSync(PACKAGES_DIR)) {
      fs.mkdirSync(PACKAGES_DIR, { recursive: true });
    }
    
    // Write the package file
    fs.writeFileSync(packagePath, JSON.stringify(packageObj, null, 2), 'utf-8');
    
    return true;
  } catch (error) {
    console.error(`Error updating package ${packageObj.name}:`, error);
    return false;
  }
}

/**
 * Adds a new package to the registry
 * 
 * @param packageObj The package object to add
 * @returns boolean indicating success
 */
export function addPackage(packageObj: Package): boolean {
  return updatePackage(packageObj);
}

/**
 * Removes a package from the registry
 * 
 * @param packageName The name of the package to remove
 * @returns boolean indicating success
 */
export function removePackage(packageName: string): boolean {
  try {
    const safeFilename = getPackageFilename(packageName);
    const packagePath = path.join(PACKAGES_DIR, `${safeFilename}.json`);
    
    // Remove the package file if it exists
    if (fs.existsSync(packagePath)) {
      fs.unlinkSync(packagePath);
    }
    
    return true;
  } catch (error) {
    console.error(`Error removing package ${packageName}:`, error);
    return false;
  }
}