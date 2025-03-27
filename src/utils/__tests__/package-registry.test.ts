import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../../');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

// Helper function to get a package file path
function getPackageFilePath(packageName: string): string {
  const safeFilename = packageName.replace(/^@/, '').replace(/\//g, '--') + '.json';
  return path.join(PACKAGES_DIR, safeFilename);
}

// Helper function to read a package file
function readPackageFile(packageName: string): any {
  const filePath = getPackageFilePath(packageName);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

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

describe('Package Registry', () => {
  beforeAll(() => {
    // Check if packages directory exists
    if (!fs.existsSync(PACKAGES_DIR)) {
      throw new Error(`
        Packages directory not found at ${PACKAGES_DIR}.
        Please run 'npm run registry:convert' before running tests.
      `);
    }
    
    // Check if at least some package files exist
    const packageFiles = fs.readdirSync(PACKAGES_DIR)
      .filter(file => file.endsWith('.json') && file !== 'package-list.json');
    
    if (packageFiles.length === 0) {
      throw new Error(`
        No package files found in ${PACKAGES_DIR}.
        Please run 'npm run registry:convert' before running tests.
      `);
    }
  });
  
  describe('Package files', () => {
    it('should exist for test case packages', () => {
      // Verify all test case packages have files
      for (const testCase of TEST_CASES) {
        const filePath = getPackageFilePath(testCase.name);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });
  });
  
  describe('Package file format', () => {
    it('should have the correct format with basic properties', () => {
      // Use the first test case as a sample
      const samplePkg = TEST_CASES[0].name;
      const packageData = readPackageFile(samplePkg);
      
      expect(packageData).toHaveProperty('name');
      expect(packageData).toHaveProperty('description');
      expect(packageData).toHaveProperty('vendor');
      expect(packageData).toHaveProperty('sourceUrl');
      expect(packageData).toHaveProperty('homepage');
      expect(packageData).toHaveProperty('license');
      expect(packageData).toHaveProperty('runtime');
      expect(packageData).toHaveProperty('environmentVariables');
    });
  });
  
  describe('Environment variables', () => {
    // Test each package from our test cases
    TEST_CASES.forEach(testCase => {
      describe(`${testCase.name}`, () => {
        it('should have the expected environment variables', () => {
          const packageData = readPackageFile(testCase.name);
          
          expect(packageData).toHaveProperty('environmentVariables');
          const envVars = packageData.environmentVariables;
          
          // Check each expected env var exists
          for (const [varName, isRequired] of Object.entries(testCase.envVars)) {
            expect(envVars).toHaveProperty(varName);
            expect(envVars[varName]).toHaveProperty('required', isRequired);
            expect(envVars[varName]).toHaveProperty('description');
            expect(typeof envVars[varName].description).toBe('string');
            expect(envVars[varName].description.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });
});