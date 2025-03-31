import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { Package, ResolvedPackage } from '../types/package.js';

// Type definitions for mocks
interface ResolvePackagesMock {
  (): ResolvedPackage[];
  mockReturnValueOnce: (value: ResolvedPackage[]) => ResolvePackagesMock;
}

interface InstallPackageMock {
  (pkg: Package): Promise<void>;
  mockResolvedValueOnce: () => InstallPackageMock;
  mockRejectedValueOnce: (error: Error) => InstallPackageMock;
}

interface PromptMock {
  <T>(questions: any): Promise<T>;
  mockResolvedValueOnce: <T>(value: T) => PromptMock;
}

// Mock package-resolver module
const mockResolvePackages = jest.fn() as unknown as ResolvePackagesMock;
jest.unstable_mockModule('../utils/package-resolver.js', () => ({
  resolvePackages: mockResolvePackages
}));

// Mock package-management module
const mockInstallPkg = jest.fn() as unknown as InstallPackageMock;
jest.unstable_mockModule('../utils/package-management.js', () => ({
  installPackage: mockInstallPkg
}));

// Mock inquirer
const mockPrompt = jest.fn() as unknown as PromptMock;
await jest.unstable_mockModule('inquirer', () => ({
  default: {
    prompt: mockPrompt
  }
}));

// Mock chalk
await jest.unstable_mockModule('chalk', () => ({
  default: {
    yellow: jest.fn((text: string) => text),
    cyan: jest.fn((text: string) => text)
  }
}));

// Import the function to test (after mocking dependencies)
const { install } = await import('../commands/install.js');

describe('install', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(((code: number) => {
      throw new Error(`Process.exit called with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should install a package when found in the curated list', async () => {
    const testPackage: ResolvedPackage = {
      name: 'test-package',
      description: 'A test package',
      runtime: 'node',
      vendor: 'Test Vendor',
      sourceUrl: 'https://example.com',
      homepage: 'https://example.com',
      license: 'MIT',
      isInstalled: false,
      isVerified: true
    };
    
    mockResolvePackages.mockReturnValueOnce([testPackage]);
    
    await install('test-package');
    
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(mockInstallPkg).toHaveBeenCalledWith(testPackage);
  });

  describe('when package is not in the curated list', () => {
    beforeEach(() => {
      mockResolvePackages.mockReturnValueOnce([]);
    });
    
    it('should warn user and exit if they choose not to proceed', async () => {
      mockPrompt.mockResolvedValueOnce({ proceedWithInstall: false });
      
      await expect(install('unknown-package')).rejects.toThrow('Process.exit called with code 1');
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Package unknown-package not found'));
      expect(console.log).toHaveBeenCalledWith('Installation cancelled.');
      expect(mockInstallPkg).not.toHaveBeenCalled();
    });
    
    it('should prompt for runtime and install if user chooses to proceed', async () => {
      mockPrompt
        .mockResolvedValueOnce({ proceedWithInstall: true })
        .mockResolvedValueOnce({ runtime: 'node' });
      
      await install('unknown-package');
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Package unknown-package not found'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Proceeding with installation of unknown-package'));
      
      // Verify created package object
      expect(mockInstallPkg).toHaveBeenCalledWith(expect.objectContaining({
        name: 'unknown-package',
        runtime: 'node',
        description: 'Unverified package'
      }));
    });
    
    it('should install a Python package when user selects Python runtime', async () => {
      mockPrompt
        .mockResolvedValueOnce({ proceedWithInstall: true })
        .mockResolvedValueOnce({ runtime: 'python' });
      
      await install('unknown-python-package');
      
      expect(mockInstallPkg).toHaveBeenCalledWith(expect.objectContaining({
        name: 'unknown-python-package',
        runtime: 'python'
      }));
    });
  });

  it('should handle installation errors', async () => {
    const testPackage: ResolvedPackage = {
      name: 'test-package',
      description: 'A test package',
      runtime: 'node',
      vendor: 'Test Vendor',
      sourceUrl: 'https://example.com',
      homepage: 'https://example.com',
      license: 'MIT',
      isInstalled: false,
      isVerified: true
    };
    
    mockResolvePackages.mockReturnValueOnce([testPackage]);
    mockInstallPkg.mockRejectedValueOnce(new Error('Installation error'));
    
    await expect(install('test-package')).rejects.toThrow('Installation error');
    
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(mockInstallPkg).toHaveBeenCalledWith(testPackage);
  });
});