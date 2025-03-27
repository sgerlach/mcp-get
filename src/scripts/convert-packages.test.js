#!/usr/bin/env node

/**
 * Test script to verify that the package conversion works correctly.
 * It focuses on checking environment variables are properly added.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Test cases - packages we expect to have environment variables
const TEST_CASES = [
  // Package name, expected env vars with their required flag
  {
    name: '@modelcontextprotocol/server-brave-search',
    envVars: {
      'BRAVE_API_KEY': true
    }
  },
  {
    name: '@kagi/mcp-server-kagi',
    envVars: {
      'KAGI_API_KEY': true
    }
  },
  {
    name: '@benborla29/mcp-server-mysql',
    envVars: {
      'MYSQL_HOST': true,
      'MYSQL_PORT': false,
      'MYSQL_USER': true,
      'MYSQL_PASS': true,
      'MYSQL_DB': false
    }
  },
  {
    name: '@enescinar/twitter-mcp',
    envVars: {
      'API_KEY': true,
      'API_SECRET_KEY': true,
      'ACCESS_TOKEN': true,
      'ACCESS_TOKEN_SECRET': true
    }
  }
];

/**
 * Gets the file path for a package
 */
function getPackageFilePath(packageName) {
  const safeFilename = packageName.replace(/^@/, '').replace(/\//g, '--') + '.json';
  return path.join(PACKAGES_DIR, safeFilename);
}

/**
 * Reads a package file and returns its contents
 */
function readPackageFile(packageName) {
  const filePath = getPackageFilePath(packageName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Package file not found: ${filePath}`);
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

/**
 * Verifies all package files exist
 */
function verifyPackageFiles() {
  console.log('Verifying package files exist...');
  
  // Verify all test case packages have files
  for (const testCase of TEST_CASES) {
    const filePath = getPackageFilePath(testCase.name);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Package file not found: ${filePath}`);
    }
  }
  
  console.log('✅ All test case package files found');
}

/**
 * Verifies a package has the expected environment variables
 */
function verifyPackage(testCase) {
  const packageName = testCase.name;
  const expectedEnvVars = testCase.envVars;
  
  console.log(`Verifying package: ${packageName}`);
  
  // Read the package file
  const packageData = readPackageFile(packageName);
  
  // Verify the package has environment variables
  if (!packageData.environmentVariables) {
    throw new Error(`Package ${packageName} does not have environment variables`);
  }
  
  // Verify all expected environment variables are present
  for (const [varName, isRequired] of Object.entries(expectedEnvVars)) {
    if (!packageData.environmentVariables[varName]) {
      throw new Error(`Package ${packageName} is missing environment variable: ${varName}`);
    }
    
    if (packageData.environmentVariables[varName].required !== isRequired) {
      throw new Error(
        `Package ${packageName} has incorrect required flag for ${varName}: ` +
        `expected ${isRequired}, got ${packageData.environmentVariables[varName].required}`
      );
    }
    
    if (!packageData.environmentVariables[varName].description) {
      throw new Error(`Package ${packageName} is missing description for ${varName}`);
    }
  }
  
  console.log(`✅ Package ${packageName} passed verification`);
}

/**
 * Main test function
 */
function runTests() {
  try {
    console.log('Running verification tests...');
    
    // Verify package files exist
    verifyPackageFiles();
    
    // Verify each test case
    for (const testCase of TEST_CASES) {
      verifyPackage(testCase);
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();