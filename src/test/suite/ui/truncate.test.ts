/**
 * Tests for truncateForDisplay utility function
 * 
 * MF-5: truncateForDisplay has zero test coverage; it writes directly
 * to the user's document `Re` field.
 */

import * as assert from 'assert';
import { truncateForDisplay } from '../../../ui/utils/truncate';

suite('truncateForDisplay Test Suite', () => {
  test('should return empty string for empty input', () => {
    assert.strictEqual(truncateForDisplay(''), '');
  });

  test('should return original text if within maxLength', () => {
    const shortText = 'Hello world';
    assert.strictEqual(truncateForDisplay(shortText), shortText);
  });

  test('should not truncate text exactly at boundary (50 chars)', () => {
    const exactly50 = 'a'.repeat(50);
    assert.strictEqual(truncateForDisplay(exactly50), exactly50);
  });

  test('should truncate text that exceeds maxLength (51 chars)', () => {
    const text51 = 'a'.repeat(51);
    const result = truncateForDisplay(text51);
    assert.strictEqual(result.length, 50);
    assert.ok(result.endsWith('...'));
    assert.strictEqual(result, 'a'.repeat(47) + '...');
  });

  test('should normalize whitespace (collapse multiple spaces)', () => {
    const withSpaces = 'hello    world';
    assert.strictEqual(truncateForDisplay(withSpaces), 'hello world');
  });

  test('should normalize whitespace (collapse newlines)', () => {
    const withNewlines = 'hello\n\nworld';
    assert.strictEqual(truncateForDisplay(withNewlines), 'hello world');
  });

  test('should normalize mixed whitespace (tabs, newlines, spaces)', () => {
    const mixed = 'hello\t\n  world\n\nfoo';
    assert.strictEqual(truncateForDisplay(mixed), 'hello world foo');
  });

  test('should trim leading and trailing whitespace', () => {
    const withPadding = '  hello world  ';
    assert.strictEqual(truncateForDisplay(withPadding), 'hello world');
  });

  test('should handle whitespace-only string', () => {
    const whitespaceOnly = '   \n\t   ';
    assert.strictEqual(truncateForDisplay(whitespaceOnly), '');
  });

  test('should respect custom maxLength parameter', () => {
    const text = 'hello world';
    assert.strictEqual(truncateForDisplay(text, 5), 'he...');
    assert.strictEqual(truncateForDisplay(text, 11), 'hello world');
    assert.strictEqual(truncateForDisplay(text, 12), 'hello world');
  });

  test('should handle edge case maxLength of 3 (minimum for ellipsis)', () => {
    const text = 'hello';
    assert.strictEqual(truncateForDisplay(text, 3), '...');
  });

  test('should handle maxLength less than 3 (produces just ellipsis)', () => {
    // Edge case: maxLength <= 2 produces empty prefix + ellipsis truncated
    const text = 'hello';
    // maxLength=2 -> slice(0, -1) = 'hell' + '...' is wrong, actual is slice(0, 2-3) = slice(0, -1)
    // This exposes potential edge case behavior
    const result1 = truncateForDisplay(text, 2);
    assert.ok(result1.length <= 3, `Result should be at most 3 chars, got: ${result1}`);
    
    const result0 = truncateForDisplay(text, 1);
    assert.ok(result0.length <= 3, `Result should be at most 3 chars, got: ${result0}`);
  });

  test('should handle long text with whitespace normalization and truncation', () => {
    const longWithSpaces = 'This is a   long text   with multiple    spaces that exceeds fifty characters';
    const result = truncateForDisplay(longWithSpaces);
    assert.strictEqual(result.length, 50);
    assert.ok(result.endsWith('...'));
    // Verify whitespace was normalized before truncation
    assert.ok(!result.includes('  '), 'Should not have consecutive spaces');
  });

  test('should handle unicode characters correctly', () => {
    const unicode = '你好世界 🎉';
    assert.strictEqual(truncateForDisplay(unicode), unicode);
    
    // Long unicode string
    const longUnicode = '你'.repeat(51);
    const result = truncateForDisplay(longUnicode);
    assert.strictEqual(result.length, 50);
    assert.ok(result.endsWith('...'));
  });
});
