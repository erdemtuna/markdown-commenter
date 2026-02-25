import * as assert from 'assert';
import { parseAnnotation, findAnnotations } from '../../../annotations/parser';

suite('Parser Test Suite', () => {
  suite('parseAnnotation', () => {
    test('should parse a complete annotation with all fields', () => {
      const blockText = `> [!COMMENT]
> **ID**: abc12345
> **Status**: Accept
> **Re**: "some quoted text"
>
> This is a comment explaining the verdict.`;

      const result = parseAnnotation(blockText);
      
      assert.ok(result);
      assert.strictEqual(result.id, 'abc12345');
      assert.strictEqual(result.status, 'Accept');
      assert.strictEqual(result.re, 'some quoted text');
      assert.strictEqual(result.comment, 'This is a comment explaining the verdict.');
    });

    test('should parse annotation without Re field', () => {
      const blockText = `> [!COMMENT]
> **ID**: xyz98765
> **Status**: Reject
>
> Rejected because of reasons.`;

      const result = parseAnnotation(blockText);
      
      assert.ok(result);
      assert.strictEqual(result.id, 'xyz98765');
      assert.strictEqual(result.status, 'Reject');
      assert.strictEqual(result.re, undefined);
      assert.strictEqual(result.comment, 'Rejected because of reasons.');
    });

    test('should parse annotation without comment', () => {
      const blockText = `> [!COMMENT]
> **ID**: skip0001
> **Status**: Skip`;

      const result = parseAnnotation(blockText);
      
      assert.ok(result);
      assert.strictEqual(result.id, 'skip0001');
      assert.strictEqual(result.status, 'Skip');
      assert.strictEqual(result.comment, undefined);
    });

    test('should parse Question verdict', () => {
      const blockText = `> [!COMMENT]
> **ID**: qqqq1111
> **Status**: Question
>
> What does this mean?`;

      const result = parseAnnotation(blockText);
      
      assert.ok(result);
      assert.strictEqual(result.status, 'Question');
    });

    test('should return null for invalid status', () => {
      const blockText = `> [!COMMENT]
> **ID**: bad00001
> **Status**: Invalid`;

      const result = parseAnnotation(blockText);
      assert.strictEqual(result, null);
    });

    test('should return null for missing ID', () => {
      const blockText = `> [!COMMENT]
> **Status**: Accept`;

      const result = parseAnnotation(blockText);
      assert.strictEqual(result, null);
    });

    test('should return null for missing Status', () => {
      const blockText = `> [!COMMENT]
> **ID**: nosta001`;

      const result = parseAnnotation(blockText);
      assert.strictEqual(result, null);
    });

    test('should return null for non-annotation block', () => {
      const blockText = `> This is just a regular blockquote
> Not an annotation`;

      const result = parseAnnotation(blockText);
      assert.strictEqual(result, null);
    });

    test('should handle multi-line comments', () => {
      const blockText = `> [!COMMENT]
> **ID**: multi001
> **Status**: Accept
>
> Line 1 of comment
> Line 2 of comment
> Line 3 of comment`;

      const result = parseAnnotation(blockText);
      
      assert.ok(result);
      assert.strictEqual(result.comment, 'Line 1 of comment\nLine 2 of comment\nLine 3 of comment');
    });
  });

  suite('findAnnotations', () => {
    test('should find single annotation in content', () => {
      const content = `# Document

Some text here.

> [!COMMENT]
> **ID**: found001
> **Status**: Accept
>
> Found it!

More text after.`;

      const results = findAnnotations(content);
      
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].annotation.id, 'found001');
      assert.strictEqual(results[0].startLine, 4);
      assert.strictEqual(results[0].endLine, 8);
    });

    test('should find multiple annotations', () => {
      const content = `# Document

> [!COMMENT]
> **ID**: first001
> **Status**: Accept

Some text between.

> [!COMMENT]
> **ID**: second02
> **Status**: Reject`;

      const results = findAnnotations(content);
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].annotation.id, 'first001');
      assert.strictEqual(results[1].annotation.id, 'second02');
    });

    test('should return empty array for no annotations', () => {
      const content = `# Just a Document

No annotations here.

> Regular blockquote`;

      const results = findAnnotations(content);
      assert.strictEqual(results.length, 0);
    });

    test('should skip malformed annotations', () => {
      const content = `# Header

> [!COMMENT]
> **ID**: good0001
> **Status**: Accept

Some text.

> [!COMMENT]
> Missing ID field here

More text.

> [!COMMENT]
> **ID**: good0002
> **Status**: Reject`;

      const results = findAnnotations(content);
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].annotation.id, 'good0001');
      assert.strictEqual(results[1].annotation.id, 'good0002');
    });
  });
});
