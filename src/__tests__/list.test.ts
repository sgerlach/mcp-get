import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { ResolvedPackage } from '../types/package.js';

// Type definitions for mocks
interface ResolvePackagesMock {
  (): ResolvedPackage[];
  mockReturnValueOnce: (value: ResolvedPackage[]) => ResolvePackagesMock;
  mockImplementationOnce: (fn: () => ResolvedPackage[]) => ResolvePackagesMock;
}

interface PromptMock {
  <T>(questions: any): Promise<T>;
  mockResolvedValueOnce: <T>(value: T) => PromptMock;
}

interface DisplayMock {
  (pkg: ResolvedPackage): Promise<string>;
  mockResolvedValueOnce: (value: string) => DisplayMock;
}

// Mock all dependent modules
const mockDisplayPackageDetailsWithActions = jest.fn() as unknown as DisplayMock;
const mockHandlePackageAction = jest.fn();
const mockCreatePackagePrompt = jest.fn();
const mockPrintPackageListHeader = jest.fn();
const mockResolvePackages = jest.fn() as unknown as ResolvePackagesMock;

// Mock package-resolver module
jest.unstable_mockModule('../utils/package-resolver.js', () => ({
  resolvePackages: mockResolvePackages
}));

// Mock display.js module
jest.unstable_mockModule('../utils/display.js', () => ({
  displayPackageDetailsWithActions: mockDisplayPackageDetailsWithActions
}));

// Mock package-actions.js module
jest.unstable_mockModule('../utils/package-actions.js', () => ({
  handlePackageAction: mockHandlePackageAction
}));

// Mock ui.js module
jest.unstable_mockModule('../utils/ui.js', () => ({
  createPackagePrompt: mockCreatePackagePrompt,
  printPackageListHeader: mockPrintPackageListHeader
}));

// Mock inquirer
const mockRegisterPrompt = jest.fn();
const mockPrompt = jest.fn() as unknown as PromptMock;
await jest.unstable_mockModule('inquirer', () => ({
  default: {
    registerPrompt: mockRegisterPrompt,
    prompt: mockPrompt
  }
}));

// Mock chalk
await jest.unstable_mockModule('chalk', () => ({
  default: {
    red: jest.fn((text: string) => text)
  }
}));

// Mock inquirer-autocomplete-prompt
await jest.unstable_mockModule('inquirer-autocomplete-prompt', () => ({
  default: jest.fn()
}));

// Import the function to test
const { list } = await import('../commands/list.js');

describe('list command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(((code: number) => {
      throw new Error(`Process.exit called with code ${code}`);
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display the package list and handle user selection', async () => {
    // Sample packages for test
    const packages = [
      { name: 'package1', isInstalled: false } as ResolvedPackage,
      { name: 'package2', isInstalled: true } as ResolvedPackage
    ];
    
    // Mock resolvePackages to return our sample packages
    mockResolvePackages.mockReturnValueOnce(packages);
    
    // Mock createPackagePrompt
    const mockPromptObj = { type: 'autocomplete', name: 'selectedPackage' };
    mockCreatePackagePrompt.mockReturnValueOnce(mockPromptObj);
    
    // Mock user selecting a package
    mockPrompt.mockResolvedValueOnce({ selectedPackage: packages[0] });
    
    // Mock display package details
    const mockAction = 'install';
    mockDisplayPackageDetailsWithActions.mockResolvedValueOnce(mockAction);
    
    // Call the list function
    await list();
    
    // Verify function calls
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(mockPrintPackageListHeader).toHaveBeenCalledWith(packages.length);
    expect(mockCreatePackagePrompt).toHaveBeenCalledWith(packages, { showInstallStatus: true });
    expect(mockPrompt).toHaveBeenCalledWith([mockPromptObj]);
    expect(mockDisplayPackageDetailsWithActions).toHaveBeenCalledWith(packages[0]);
    expect(mockHandlePackageAction).toHaveBeenCalledWith(
      packages[0],
      mockAction,
      expect.objectContaining({ onBack: expect.any(Function) })
    );
  });

  it('should do nothing if no package is selected', async () => {
    // Sample packages for test
    const packages = [
      { name: 'package1', isInstalled: false } as ResolvedPackage,
      { name: 'package2', isInstalled: true } as ResolvedPackage
    ];
    
    // Mock resolvePackages to return our sample packages
    mockResolvePackages.mockReturnValueOnce(packages);
    
    // Mock createPackagePrompt
    mockCreatePackagePrompt.mockReturnValueOnce({});
    
    // Mock user not selecting a package
    mockPrompt.mockResolvedValueOnce({ selectedPackage: null });
    
    // Call the list function
    await list();
    
    // Verify function calls
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(mockPrintPackageListHeader).toHaveBeenCalled();
    expect(mockPrompt).toHaveBeenCalled();
    expect(mockDisplayPackageDetailsWithActions).not.toHaveBeenCalled();
    expect(mockHandlePackageAction).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Mock an error when resolving packages
    const testError = new Error('Test error');
    mockResolvePackages.mockImplementationOnce(() => {
      throw testError;
    });
    
    // Call the list function and expect an error
    await expect(list()).rejects.toThrow('Process.exit called with code 1');
    
    // Verify error logging
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error loading package list'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});