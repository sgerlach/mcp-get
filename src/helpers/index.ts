import { PackageHelpers } from '../types/index.js';

export const packageHelpers: PackageHelpers = {
  '@modelcontextprotocol/server-brave-search': {
    requiredEnvVars: {
      BRAVE_API_KEY: {
        description: 'API key for Brave Search',
        required: true
      }
    }
  }
}; 