import * as assert from 'assert';
import { getPlatformInfo, resolvePromptsDirectory } from '../../../agents/platformDetection';

suite('Platform Detection Test Suite', () => {
  suite('getPlatformInfo', () => {
    test('should return a valid platform', () => {
      const platform = getPlatformInfo();
      assert.ok(['darwin', 'win32', 'linux'].includes(platform));
    });
  });

  suite('resolvePromptsDirectory', () => {
    test('should return custom path when provided', () => {
      const customPath = '/custom/prompts/dir';
      const result = resolvePromptsDirectory('linux', customPath);
      assert.strictEqual(result, customPath);
    });

    test('should return linux path for linux platform', () => {
      const result = resolvePromptsDirectory('linux');
      assert.ok(result.includes('.config/Code/User/prompts'));
    });

    test('should return darwin path for macOS platform', () => {
      const result = resolvePromptsDirectory('darwin');
      assert.ok(result.includes('Library/Application Support/Code/User/prompts'));
    });

    test('should return windows path for win32 platform', () => {
      const result = resolvePromptsDirectory('win32');
      assert.ok(result.includes('Code') && result.includes('User') && result.includes('prompts'));
    });

    test('custom path should override platform default', () => {
      const customPath = '/my/custom/path';
      
      assert.strictEqual(resolvePromptsDirectory('linux', customPath), customPath);
      assert.strictEqual(resolvePromptsDirectory('darwin', customPath), customPath);
      assert.strictEqual(resolvePromptsDirectory('win32', customPath), customPath);
    });
  });
});
