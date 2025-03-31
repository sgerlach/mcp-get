import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { ResolvedPackage } from '../types/package.js';

// Type for mockResolvePackage
interface ResolvePackageMock {
  (packageName: string): ResolvedPackage | null;
  mockReturnValueOnce: (value: ResolvedPackage | null) => ResolvePackageMock;
}

// Type for mockUninstallPackage
interface UninstallPackageMock {
  (packageName: string): Promise<void>;
  mockResolvedValueOnce: () => UninstallPackageMock;
  mockRejectedValueOnce: (error: Error) => UninstallPackageMock;
}

// Type for mockPrompt
interface PromptMock {
  <T>(questions: any): Promise<T>;
  mockResolvedValueOnce: <T>(value: T) => PromptMock;
}

// Mock package-resolver module
const mockResolvePackage = jest.fn() as unknown as ResolvePackageMock;
jest.unstable_mockModule('../utils/package-resolver.js', () => ({
  resolvePackage: mockResolvePackage
}));

// Mock package-management module
const mockUninstallPackage = jest.fn() as unknown as UninstallPackageMock;
jest.unstable_mockModule('../utils/package-management.js', () => ({
  uninstallPackage: mockUninstallPackage
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
    red: jest.fn((text: string) => text),
    yellow: jest.fn((text: string) => text),
    green: jest.fn((text: string) => text)
  }
}));

// Import the function to test (after mocking dependencies)
const { uninstall } = await import('../commands/uninstall.js');

describe('uninstall', () => {
  // Spy on console methods
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(((code: number) => {
      throw new Error(`Process.exit called with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should exit with error if no package name is provided', async () => {
    await expect(uninstall()).rejects.toThrow('Process.exit called with code 1');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Package name is required'));
  });

  it('should show message if package is not found', async () => {
    mockResolvePackage.mockReturnValueOnce(null);
    
    await uninstall('non-existent-package');
    
    expect(mockResolvePackage).toHaveBeenCalledWith('non-existent-package');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Package non-existent-package not found'));
  });

  it('should show message if package is not installed', async () => {
    mockResolvePackage.mockReturnValueOnce({ 
      name: 'test-package',
      isInstalled: false
    } as ResolvedPackage);
    
    await uninstall('test-package');
    
    expect(mockResolvePackage).toHaveBeenCalledWith('test-package');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Package test-package is not installed'));
  });

  it('should cancel uninstallation if user does not confirm', async () => {
    mockResolvePackage.mockReturnValueOnce({ 
      name: 'test-package',
      isInstalled: true
    } as ResolvedPackage);
    
    mockPrompt.mockResolvedValueOnce({ confirmUninstall: false });
    
    await uninstall('test-package');
    
    expect(mockUninstallPackage).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Uninstallation cancelled.');
  });

  it('should uninstall package if user confirms', async () => {
    mockResolvePackage.mockReturnValueOnce({ 
      name: 'test-package',
      isInstalled: true
    } as ResolvedPackage);
    
    mockPrompt.mockResolvedValueOnce({ confirmUninstall: true });
    
    await uninstall('test-package');
    
    expect(mockUninstallPackage).toHaveBeenCalledWith('test-package');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully uninstalled test-package'));
  });

  it('should uninstall package with slashes in config if user confirms', async () => {
    mockResolvePackage.mockReturnValueOnce({ 
      name: '@scope/package',
      isInstalled: true
    } as ResolvedPackage);
    
    mockPrompt.mockResolvedValueOnce({ confirmUninstall: true });
    
    await uninstall('@scope/package');
    
    expect(mockUninstallPackage).toHaveBeenCalledWith('@scope/package');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully uninstalled @scope/package'));
  });

  it('should handle errors during uninstallation', async () => {
    mockResolvePackage.mockReturnValueOnce({ 
      name: 'test-package',
      isInstalled: true
    } as ResolvedPackage);
    
    mockPrompt.mockResolvedValueOnce({ confirmUninstall: true });
    const error = new Error('Uninstall error');
    mockUninstallPackage.mockRejectedValueOnce(error);
    
    await expect(uninstall('test-package')).rejects.toThrow('Process.exit called with code 1');
    
    expect(mockUninstallPackage).toHaveBeenCalledWith('test-package');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to uninstall package'));
  });
});