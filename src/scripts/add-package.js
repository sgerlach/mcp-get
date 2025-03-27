#!/usr/bin/env node

/**
 * This script adds a new package to the registry by creating a new package file
 * and updating the index. It will also validate the package against the required fields.
 * 
 * Usage: node src/scripts/add-package.js [--validate-only] <package-file.json>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.join(__dirname, '../../');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Required fields for a valid package
const REQUIRED_FIELDS = ['name', 'description', 'vendor', 'sourceUrl', 'homepage', 'license', 'runtime'];
const VALID_RUNTIMES = ['node', 'python'];

/**
 * Safely creates a directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Converts a package name to a safe filename
 */
function getPackageFilename(packageName) {
  // Replace special characters in package name to create a valid filename
  // Remove @ and replace / with -- to avoid directory nesting
  return packageName.replace(/^@/, '').replace(/\//g, '--');
}

/**
 * Validates a package object against the required fields
 */
function validatePackage(pkg) {
  const errors = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!pkg[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate URLs
  const urlFields = ['sourceUrl', 'homepage'];
  for (const field of urlFields) {
    if (pkg[field] && !pkg[field].startsWith('http://') && !pkg[field].startsWith('https://')) {
      errors.push(`Invalid ${field} URL: ${pkg[field]} - must start with http:// or https://`);
    }
  }
  
  // Validate runtime
  if (pkg.runtime && !VALID_RUNTIMES.includes(pkg.runtime)) {
    errors.push(`Invalid runtime: ${pkg.runtime}. Must be one of: ${VALID_RUNTIMES.join(', ')}`);
  }
  
  return errors;
}

/**
 * Main function to add a new package
 */
async function addPackage(packageFilePath, validateOnly = false) {
  try {
    // Read the package file
    const packageContent = fs.readFileSync(packageFilePath, 'utf-8');
    let packageObj;
    
    try {
      packageObj = JSON.parse(packageContent);
    } catch (error) {
      console.error('Error parsing package file:', error);
      process.exit(1);
    }
    
    // Validate the package
    const validationErrors = validatePackage(packageObj);
    if (validationErrors.length > 0) {
      console.error('Package validation failed:');
      validationErrors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    }
    
    console.log('Package validation successful!');
    
    // Stop here if we're only validating
    if (validateOnly) {
      return;
    }
    
    // Make sure the packages directory exists
    ensureDirectoryExists(PACKAGES_DIR);
    
    // Get the package name and safe filename
    const packageName = packageObj.name;
    const safeFilename = getPackageFilename(packageName);
    
    // Check if the package already exists
    const newPackagePath = path.join(PACKAGES_DIR, `${safeFilename}.json`);
    if (fs.existsSync(newPackagePath)) {
      console.error(`Package ${packageName} already exists at ${newPackagePath}`);
      process.exit(1);
    }
    
    // We no longer maintain an index file - packages are detected by scanning the directory
    
    // Write the package file
    fs.writeFileSync(newPackagePath, JSON.stringify(packageObj, null, 2), 'utf-8');
    console.log(`Created package file: ${newPackagePath}`);
    
    console.log(`\nPackage ${packageName} added successfully!`);
    
  } catch (error) {
    console.error('Error adding package:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let validateOnly = false;
let packageFilePath;

if (args.includes('--validate-only')) {
  validateOnly = true;
  args.splice(args.indexOf('--validate-only'), 1);
}

packageFilePath = args[0];

if (!packageFilePath) {
  console.error('Please provide a package file path');
  console.error('Usage: node src/scripts/add-package.js [--validate-only] <package-file.json>');
  process.exit(1);
}

if (!fs.existsSync(packageFilePath)) {
  console.error(`Package file not found: ${packageFilePath}`);
  process.exit(1);
}

// Run the script
addPackage(packageFilePath, validateOnly);