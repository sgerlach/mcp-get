const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const REQUIRED_FIELDS = ['name', 'description', 'vendor', 'sourceUrl', 'homepage', 'license', 'runtime'];
const VALID_RUNTIMES = ['node', 'python'];

async function validatePackages() {
  const packageListPath = path.join(__dirname, '../../packages/package-list.json');
  const packageList = JSON.parse(fs.readFileSync(packageListPath, 'utf-8'));

  // Validate JSON formatting
  validateJsonFormatting(packageListPath);

  const newPackages = getNewPackages(packageList);

  for (const pkg of newPackages) {
    validateRequiredFields(pkg);
    validateRuntime(pkg);
    await validatePackagePublication(pkg);
    await validateEnvironmentVariables(pkg);
  }

  await provideFeedback(newPackages);
}

function validateJsonFormatting(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for consistent indentation (2 spaces)
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && line.match(/^ +/)?.[0]?.length % 2 !== 0) {
      throw new Error('Inconsistent indentation detected. Use 2 spaces for indentation.');
    }
  }

  // Check for trailing commas and proper array formatting
  if (!content.match(/,\n *}/g)) {
    throw new Error('Missing trailing commas in JSON objects');
  }

  // Validate overall JSON structure
  try {
    JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

function getNewPackages(packageList) {
  const baseBranch = 'main';
  const diffOutput = execSync(`git diff origin/${baseBranch} -- packages/package-list.json`).toString();
  const newPackages = [];

  const diffLines = diffOutput.split('\n');
  let currentPackage = null;

  for (const line of diffLines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const trimmedLine = line.substring(1).trim();
      if (trimmedLine.startsWith('{')) {
        currentPackage = {};
      } else if (trimmedLine.startsWith('}')) {
        if (currentPackage) {
          newPackages.push(currentPackage);
          currentPackage = null;
        }
      } else if (currentPackage) {
        const [key, value] = trimmedLine.split(':').map(s => s.trim().replace(/,$/, '').replace(/"/g, ''));
        currentPackage[key] = value;
      }
    }
  }

  return newPackages;
}

function validateRequiredFields(pkg) {
  for (const field of REQUIRED_FIELDS) {
    if (!pkg[field]) {
      throw new Error(`Package ${pkg.name} is missing required field: ${field}`);
    }
  }

  // Validate URL formats
  const urlFields = ['sourceUrl', 'homepage'];
  for (const field of urlFields) {
    try {
      new URL(pkg[field]);
    } catch (error) {
      throw new Error(`Package ${pkg.name} has invalid ${field} URL: ${pkg[field]}`);
    }
  }
}

function validateRuntime(pkg) {
  if (!VALID_RUNTIMES.includes(pkg.runtime)) {
    throw new Error(`Package ${pkg.name} has invalid runtime: ${pkg.runtime}. Must be one of: ${VALID_RUNTIMES.join(', ')}`);
  }
}

async function validatePackagePublication(pkg) {
  const { name, runtime } = pkg;

  if (runtime === 'node') {
    try {
      execSync(`npm view ${name}`);
    } catch (error) {
      throw new Error(`Package ${name} is not published on npm`);
    }
  } else if (runtime === 'python') {
    try {
      execSync(`pip search ${name} --index https://uvx.org/pypi/simple/`);
    } catch (error) {
      throw new Error(`Package ${name} is not published on uvx`);
    }
  }
}

async function validateEnvironmentVariables(pkg) {
  const helperPath = path.join(__dirname, '../helpers/index.ts');
  const helperContent = fs.readFileSync(helperPath, 'utf-8');

  // Check if package has helper documentation
  if (!helperContent.includes(pkg.name)) {
    throw new Error(`Package ${pkg.name} is missing environment variable documentation in helpers/index.ts`);
  }

  // Parse helper content to verify env var documentation
  const helperMatch = helperContent.match(new RegExp(`['"]${pkg.name}['"]:\\s*{[^}]*}`, 's'));
  if (!helperMatch) {
    throw new Error(`Invalid environment variable documentation format for package ${pkg.name}`);
  }

  // Verify required env vars have descriptions
  const envVarSection = helperMatch[0];
  const requiredVars = envVarSection.match(/required:\s*true/g) || [];
  const descriptions = envVarSection.match(/description:/g) || [];

  if (requiredVars.length !== descriptions.length) {
    throw new Error(`Missing descriptions for required environment variables in package ${pkg.name}`);
  }
}

async function provideFeedback(newPackages) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { data: pullRequest } = await octokit.pulls.get({
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
    pull_number: process.env.GITHUB_PULL_REQUEST_NUMBER
  });

  const feedback = newPackages.length > 0
    ? `The following new packages were validated successfully:\n${newPackages.map(pkg => `- ${pkg.name}`).join('\n')}`
    : 'No new packages were added in this PR.';

  await octokit.issues.createComment({
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
    issue_number: pullRequest.number,
    body: feedback
  });
}

validatePackages().catch(error => {
  console.error(error);
  process.exit(1);
});
