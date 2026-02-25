import * as assert from 'assert';
import { parseAnnotation, formatAnnotation, generateId, findAnnotations, insertAnnotation } from '../../../annotations';
import { Annotation, Verdict } from '../../../annotations/types';

suite('Integration Test Suite', () => {
  suite('Round-trip tests', () => {
    test('should round-trip minimal annotation', () => {
      const original: Annotation = {
        id: generateId(),
        status: 'Accept'
      };

      const formatted = formatAnnotation(original);
      const parsed = parseAnnotation(formatted);

      assert.ok(parsed);
      assert.strictEqual(parsed.id, original.id);
      assert.strictEqual(parsed.status, original.status);
      assert.strictEqual(parsed.re, undefined);
      assert.strictEqual(parsed.comment, undefined);
    });

    test('should round-trip annotation with Re field', () => {
      const original: Annotation = {
        id: 'roundtrp',
        status: 'Reject',
        re: 'some referenced text'
      };

      const formatted = formatAnnotation(original);
      const parsed = parseAnnotation(formatted);

      assert.ok(parsed);
      assert.strictEqual(parsed.re, original.re);
    });

    test('should round-trip annotation with comment', () => {
      const original: Annotation = {
        id: 'withcomm',
        status: 'Skip',
        comment: 'This is a detailed comment explaining the decision.'
      };

      const formatted = formatAnnotation(original);
      const parsed = parseAnnotation(formatted);

      assert.ok(parsed);
      assert.strictEqual(parsed.comment, original.comment);
    });

    test('should round-trip complete annotation', () => {
      const original: Annotation = {
        id: 'complete',
        status: 'Question',
        re: 'unclear finding',
        comment: 'Need more context on this.'
      };

      const formatted = formatAnnotation(original);
      const parsed = parseAnnotation(formatted);

      assert.ok(parsed);
      assert.deepStrictEqual(parsed, original);
    });

    test('should round-trip all verdict types', () => {
      const verdicts: Verdict[] = ['Accept', 'Reject', 'Skip', 'Question'];
      
      for (const verdict of verdicts) {
        const original: Annotation = {
          id: `verd${verdict.substring(0, 4).toLowerCase()}`,
          status: verdict
        };

        const formatted = formatAnnotation(original);
        const parsed = parseAnnotation(formatted);

        assert.ok(parsed, `Failed to parse ${verdict}`);
        assert.strictEqual(parsed.status, verdict);
      }
    });
  });

  suite('Insert and find', () => {
    test('should find annotation after inserting into empty document', () => {
      const content = `# Document Title

Some content here.`;
      
      const annotation: Annotation = {
        id: 'inserted',
        status: 'Accept',
        comment: 'Looks good!'
      };

      const modified = insertAnnotation(content, 2, annotation);
      const found = findAnnotations(modified);

      assert.strictEqual(found.length, 1);
      assert.strictEqual(found[0].annotation.id, 'inserted');
      assert.strictEqual(found[0].annotation.comment, 'Looks good!');
    });

    test('should find multiple inserted annotations', () => {
      let content = `# Document

Finding 1.

Finding 2.

Finding 3.`;

      const annotations: Annotation[] = [
        { id: 'ann00001', status: 'Accept' },
        { id: 'ann00002', status: 'Reject' },
        { id: 'ann00003', status: 'Skip' }
      ];

      // Insert annotations in reverse order to maintain line numbers
      content = insertAnnotation(content, 6, annotations[2]);
      content = insertAnnotation(content, 4, annotations[1]);
      content = insertAnnotation(content, 2, annotations[0]);

      const found = findAnnotations(content);

      assert.strictEqual(found.length, 3);
      assert.strictEqual(found[0].annotation.id, 'ann00001');
      assert.strictEqual(found[1].annotation.id, 'ann00002');
      assert.strictEqual(found[2].annotation.id, 'ann00003');
    });
  });
});
