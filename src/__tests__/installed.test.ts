import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { ResolvedPackage } from '../types/package.js';

// Type definitions for mocks
interface ResolvePackagesMock {
  (): ResolvedPackage[];
  mockReturnValueOnce: (value: ResolvedPackage[]) => ResolvePackagesMock;
}

interface PromptMock {
  <T>(questions: any): Promise<T>;
  mockResolvedValueOnce: <T>(value: T) => PromptMock;
}

interface DisplayMock {
  (pkg: ResolvedPackage): Promise<string>;
  mockResolvedValueOnce: (value: string) => DisplayMock;
}

// Mock function for display and package actions
const mockDisplayPackageDetailsWithActions = jest.fn() as unknown as DisplayMock;
const mockHandlePackageAction = jest.fn();
const mockCreatePackagePrompt = jest.fn();
const mockPrintPackageListHeader = jest.fn();

// Mock package-resolver module
const mockResolvePackages = jest.fn() as unknown as ResolvePackagesMock;
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
    yellow: jest.fn((text: string) => text)
  }
}));

// Mock inquirer-autocomplete-prompt
await jest.unstable_mockModule('inquirer-autocomplete-prompt', () => ({
  default: jest.fn()
}));

// Import the function to test (after mocking dependencies)
const { listInstalledPackages } = await import('../commands/installed.js');

describe('listInstalledPackages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show message when no packages are installed', async () => {
    // Mock empty installed packages list
    mockResolvePackages.mockReturnValueOnce([
      { name: 'pkg1', isInstalled: false } as ResolvedPackage,
      { name: 'pkg2', isInstalled: false } as ResolvedPackage
    ]);
    
    await listInstalledPackages();
    
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No MCP servers are currently installed'));
    expect(mockPrintPackageListHeader).not.toHaveBeenCalled();
    expect(mockPrompt).not.toHaveBeenCalled();
  });

  it('should display installed packages and handle user selection', async () => {
    // Mock installed packages
    const installedPackages = [
      { name: 'pkg1', isInstalled: true } as ResolvedPackage,
      { name: 'pkg2', isInstalled: true } as ResolvedPackage
    ];
    mockResolvePackages.mockReturnValueOnce([
      ...installedPackages,
      { name: 'pkg3', isInstalled: false } as ResolvedPackage
    ]);
    
    // Mock UI components
    const mockPromptObj = { type: 'autocomplete', name: 'selectedPackage' };
    mockCreatePackagePrompt.mockReturnValueOnce(mockPromptObj);
    mockPrompt.mockResolvedValueOnce({ selectedPackage: installedPackages[0] });
    
    // Mock display package details
    const mockAction = 'uninstall';
    mockDisplayPackageDetailsWithActions.mockResolvedValueOnce(mockAction);
    
    await listInstalledPackages();
    
    // Verify the correct functions were called
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(mockPrintPackageListHeader).toHaveBeenCalledWith(2, 'installed');
    expect(mockCreatePackagePrompt).toHaveBeenCalledWith(installedPackages, expect.any(Object));
    expect(mockPrompt).toHaveBeenCalledWith([mockPromptObj]);
    expect(mockDisplayPackageDetailsWithActions).toHaveBeenCalledWith(installedPackages[0]);
    expect(mockHandlePackageAction).toHaveBeenCalledWith(
      installedPackages[0],
      mockAction,
      expect.objectContaining({
        onUninstall: expect.any(Function),
        onBack: expect.any(Function)
      })
    );
  });

  it('should do nothing if no package is selected', async () => {
    // Mock installed packages
    const installedPackages = [
      { name: 'pkg1', isInstalled: true } as ResolvedPackage,
      { name: 'pkg2', isInstalled: true } as ResolvedPackage
    ];
    mockResolvePackages.mockReturnValueOnce(installedPackages);
    
    // Mock UI components
    mockCreatePackagePrompt.mockReturnValueOnce({});
    mockPrompt.mockResolvedValueOnce({ selectedPackage: null });
    
    await listInstalledPackages();
    
    expect(mockResolvePackages).toHaveBeenCalled();
    expect(mockPrompt).toHaveBeenCalled();
    expect(mockDisplayPackageDetailsWithActions).not.toHaveBeenCalled();
    expect(mockHandlePackageAction).not.toHaveBeenCalled();
  });
});