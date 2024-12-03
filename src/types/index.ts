export interface Package {
  name: string;
  description: string;
  vendor: string;
  sourceUrl: string;
  homepage: string;
  license: string;
  runtime: 'node' | 'python';
  isInstalled?: boolean;
}

export interface PackageHelper {
  requiredEnvVars?: {
    [key: string]: {
      description: string;
      required: boolean;
      argName?: string;
    }
  };
  configureEnv?: (config: any) => Promise<void>;
  runtime?: 'node' | 'python';
}

export interface PackageHelpers {
  [packageName: string]: PackageHelper;
} 