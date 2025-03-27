#!/usr/bin/env node

/**
 * This script migrates environment variables from helpers/index.ts to the registry files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.join(__dirname, '../../');
const HELPERS_PATH = path.join(ROOT_DIR, 'src/helpers/index.ts');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

/**
 * Extracts packageHelpers object from the helpers/index.ts file
 * by reading and parsing it manually
 */
function extractPackageHelpers() {
  try {
    const helperContent = fs.readFileSync(HELPERS_PATH, 'utf-8');
    
    // Find the beginning and end of the packageHelpers object
    const startIndex = helperContent.indexOf('export const packageHelpers: PackageHelpers = {');
    const endIndex = helperContent.lastIndexOf('};');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find packageHelpers object in file');
      return {};
    }
    
    // Extract the object content
    const packageHelpersContent = helperContent.slice(
      startIndex + 'export const packageHelpers: PackageHelpers = {'.length,
      endIndex
    );
    
    // Parse each package and its environment variables
    const packages = {};
    const packageMatches = [...packageHelpersContent.matchAll(/'([^']+)':\s*{([^}]+)}/g)];
    
    for (const match of packageMatches) {
      const packageName = match[1];
      const packageContent = match[2];
      
      // Parse required environment variables
      if (packageContent.includes('requiredEnvVars')) {
        const envVarsMatch = packageContent.match(/requiredEnvVars:\s*{([^}]+)}/);
        if (envVarsMatch) {
          const envVarsContent = envVarsMatch[1];
          const envVars = {};
          
          // Find individual environment variables
          const envVarMatches = [...envVarsContent.matchAll(/(\w+(?:-\w+)?):\s*{([^}]+)}/g)];
          
          for (const envVarMatch of envVarMatches) {
            const envVarName = envVarMatch[1];
            const envVarContent = envVarMatch[2];
            
            // Extract description
            const descriptionMatch = envVarContent.match(/description:\s*'([^']+)'/);
            const description = descriptionMatch ? descriptionMatch[1] : '';
            
            // Extract required
            const requiredMatch = envVarContent.match(/required:\s*(true|false)/);
            const required = requiredMatch ? requiredMatch[1] === 'true' : true;
            
            // Extract argName if present
            const argNameMatch = envVarContent.match(/argName:\s*'([^']+)'/);
            const argName = argNameMatch ? argNameMatch[1] : undefined;
            
            // Create the environment variable object
            envVars[envVarName] = {
              description,
              required
            };
            
            if (argName) {
              envVars[envVarName].argName = argName;
            }
          }
          
          packages[packageName] = {
            requiredEnvVars: envVars
          };
        }
      }
    }
    
    return packages;
  } catch (error) {
    console.error('Error extracting package helpers:', error);
    return {};
  }
}

/**
 * Updates registry files with environment variables
 */
async function migrateEnvVars() {
  // Extract package helpers
  const packageHelpers = extractPackageHelpers();
  console.log(`Extracted environment variables for ${Object.keys(packageHelpers).length} packages`);
  
  // Read all package files
  const files = fs.readdirSync(PACKAGES_DIR);
  
  // Keep track of successful and failed migrations
  let successCount = 0;
  let skipCount = 0;
  const failures = [];
  
  // Process each package file
  for (const file of files) {
    if (!file.endsWith('.json') || file === 'package-list.json') {
      continue;
    }
    
    const filePath = path.join(PACKAGES_DIR, file);
    
    try {
      // Read the registry file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const packageData = JSON.parse(fileContent);
      const packageName = packageData.name;
      
      // If we have environment variables for this package, add them
      if (packageHelpers[packageName]?.requiredEnvVars) {
        // Skip if already has non-empty environment variables
        if (packageData.environmentVariables && Object.keys(packageData.environmentVariables).length > 0) {
          console.log(`Skipping ${packageName} - already has environment variables`);
          skipCount++;
          continue;
        }
        
        // Add environment variables
        packageData.environmentVariables = packageHelpers[packageName].requiredEnvVars;
        
        // Write the updated registry file
        fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2), 'utf-8');
        console.log(`Updated ${packageName} with ${Object.keys(packageData.environmentVariables).length} environment variables`);
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
      failures.push(file);
    }
  }
  
  console.log('\nMigration summary:');
  console.log(`- Successfully updated: ${successCount} packages`);
  console.log(`- Skipped (already had environment variables): ${skipCount} packages`);
  console.log(`- Failed: ${failures.length} packages`);
  
  if (failures.length > 0) {
    console.log('\nFailed packages:');
    failures.forEach(file => console.log(`- ${file}`));
  }
}

// Run the migration
migrateEnvVars();