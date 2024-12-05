const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const REQUIRED_FIELDS = ['name', 'description', 'vendor', 'sourceUrl', 'homepage', 'license', 'runtime'];

async function validatePackages() {
  const packageListPath = path.join(__dirname, '../../packages/package-list.json');
  const packageList = JSON.parse(fs.readFileSync(packageListPath, 'utf-8'));

  const newPackages = getNewPackages(packageList);

  for (const pkg of newPackages) {
    validateRequiredFields(pkg);
    await checkNpmPublication(pkg.name);
  }

  await provideFeedback(newPackages);
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
}

async function checkNpmPublication(packageName) {
  try {
    execSync(`npm view ${packageName}`);
  } catch (error) {
    throw new Error(`Package ${packageName} is not published on npm`);
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
