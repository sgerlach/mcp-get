import { jest, describe, it, expect } from '@jest/globals';
import { fileURLToPath } from 'url';
import path from 'path';

const prCheckPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/pr-check.js');

jest.mock(prCheckPath, () => {
  const originalModule = jest.requireActual(prCheckPath);
  return {
    ...originalModule,
    default: jest.fn(),
  };
});

const { normalizePackageName } = await import(prCheckPath);

describe('PR Check Utilities', () => {
  describe('normalizePackageName', () => {
    it('should normalize npm package names correctly', () => {
      expect(normalizePackageName('Test Package', 'node')).toBe('test-package');
      expect(normalizePackageName('Test_Package', 'node')).toBe('test_package');
      expect(normalizePackageName('Test-Package', 'node')).toBe('test-package');
      expect(normalizePackageName('@scope/package', 'node')).toBe('scope-package');
      expect(normalizePackageName('Bazi MCP', 'node')).toBe('bazi-mcp');
    });

    it('should normalize Python package names correctly', () => {
      expect(normalizePackageName('Test Package', 'python')).toBe('test-package');
      expect(normalizePackageName('Test_Package', 'python')).toBe('test-package');
      expect(normalizePackageName('Test-Package', 'python')).toBe('test-package');
    });

    it('should handle empty or undefined names', () => {
      expect(normalizePackageName('', 'node')).toBe('');
      expect(normalizePackageName(undefined, 'node')).toBe('');
    });
  });
});
