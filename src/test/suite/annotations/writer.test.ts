import * as assert from 'assert';
import { generateId, formatAnnotation, insertAnnotation } from '../../../annotations/writer';
import { Annotation } from '../../../annotations/types';

suite('Writer Test Suite', () => {
  suite('generateId', () => {
    test('should generate 8-character ID', () => {
      const id = generateId();
      assert.strictEqual(id.length, 8);
    });

    test('should only contain lowercase letters and digits', () => {
      const id = generateId();
      assert.ok(/^[a-z0-9]+$/.test(id));
    });

    test('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      // Should have at least 95 unique IDs out of 100 (some collision is possible)
      assert.ok(ids.size >= 95);
    });
  });

  suite('formatAnnotation', () => {
    test('should format Accept verdict', () => {
      const annotation: Annotation = {
        id: 'test0001',
        status: 'Accept'
      };

      const result = formatAnnotation(annotation);
      
      assert.ok(result.includes('> [!COMMENT]'));
      assert.ok(result.includes('> **ID**: test0001'));
      assert.ok(result.includes('> **Status**: Accept'));
    });

    test('should format Reject verdict', () => {
      const annotation: Annotation = {
        id: 'test0002',
        status: 'Reject'
      };

      const result = formatAnnotation(annotation);
      assert.ok(result.includes('> **Status**: Reject'));
    });

    test('should format Skip verdict', () => {
      const annotation: Annotation = {
        id: 'test0003',
        status: 'Skip'
      };

      const result = formatAnnotation(annotation);
      assert.ok(result.includes('> **Status**: Skip'));
    });

    test('should format Question verdict', () => {
      const annotation: Annotation = {
        id: 'test0004',
        status: 'Question'
      };

      const result = formatAnnotation(annotation);
      assert.ok(result.includes('> **Status**: Question'));
    });

    test('should include Re field when present', () => {
      const annotation: Annotation = {
        id: 'test0005',
        status: 'Accept',
        re: 'quoted text here'
      };

      const result = formatAnnotation(annotation);
      assert.ok(result.includes('> **Re**: "quoted text here"'));
    });

    test('should not include Re field when absent', () => {
      const annotation: Annotation = {
        id: 'test0006',
        status: 'Accept'
      };

      const result = formatAnnotation(annotation);
      assert.ok(!result.includes('**Re**'));
    });

    test('should include comment when present', () => {
      const annotation: Annotation = {
        id: 'test0007',
        status: 'Reject',
        comment: 'This is my comment.'
      };

      const result = formatAnnotation(annotation);
      assert.ok(result.includes('> This is my comment.'));
    });

    test('should handle multi-line comments', () => {
      const annotation: Annotation = {
        id: 'test0008',
        status: 'Accept',
        comment: 'Line 1\nLine 2\nLine 3'
      };

      const result = formatAnnotation(annotation);
      assert.ok(result.includes('> Line 1'));
      assert.ok(result.includes('> Line 2'));
      assert.ok(result.includes('> Line 3'));
    });

    test('should format complete annotation with all fields', () => {
      const annotation: Annotation = {
        id: 'complete',
        status: 'Accept',
        re: 'important finding',
        comment: 'Fully agreed with this.'
      };

      const result = formatAnnotation(annotation);
      const expected = `> [!COMMENT]
> **ID**: complete
> **Status**: Accept
> **Re**: "important finding"
>
> Fully agreed with this.`;

      assert.strictEqual(result, expected);
    });
  });

  suite('insertAnnotation', () => {
    test('should insert annotation after specified line', () => {
      const content = `Line 0
Line 1
Line 2`;
      const annotation: Annotation = {
        id: 'ins00001',
        status: 'Accept'
      };

      const result = insertAnnotation(content, 1, annotation);
      const lines = result.split('\n');
      
      assert.strictEqual(lines[0], 'Line 0');
      assert.strictEqual(lines[1], 'Line 1');
      assert.strictEqual(lines[2], '');  // blank line before
      assert.ok(lines[3].includes('[!COMMENT]'));
    });

    test('should handle insertion at start', () => {
      const content = `First line
Second line`;
      const annotation: Annotation = {
        id: 'start001',
        status: 'Skip'
      };

      const result = insertAnnotation(content, 0, annotation);
      const lines = result.split('\n');
      
      assert.strictEqual(lines[0], 'First line');
      assert.strictEqual(lines[1], '');
      assert.ok(lines[2].includes('[!COMMENT]'));
    });

    test('should handle insertion at end', () => {
      const content = `Line A
Line B`;
      const annotation: Annotation = {
        id: 'end00001',
        status: 'Reject'
      };

      const result = insertAnnotation(content, 1, annotation);
      const lines = result.split('\n');
      
      assert.strictEqual(lines[0], 'Line A');
      assert.strictEqual(lines[1], 'Line B');
      assert.strictEqual(lines[2], '');
      assert.ok(lines[3].includes('[!COMMENT]'));
    });

    test('should add proper spacing around annotation', () => {
      const content = `Before
After`;
      const annotation: Annotation = {
        id: 'space001',
        status: 'Accept'
      };

      const result = insertAnnotation(content, 0, annotation);
      
      // Should have blank line before and after annotation
      assert.ok(result.includes('Before\n\n>'));
      assert.ok(result.includes('Accept\n\nAfter'));
    });
  });
});
