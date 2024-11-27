export interface Package {
  name: string;
  description: string;
  vendor: string;
  sourceUrl: string;
  homepage: string;
  license: string;
}

export interface PackageHelper {
  requiredEnvVars?: {
    [key: string]: {
      description: string;
      required: boolean;
    }
  };
  configureEnv?: (config: any) => Promise<void>;
}

export interface PackageHelpers {
  [packageName: string]: PackageHelper;
} 