import * as assert from 'assert';
import { parseSkillFrontmatter } from '../../../skills/skillLoader';

suite('Skill Loader Test Suite', () => {
  suite('parseSkillFrontmatter', () => {
    test('should parse valid frontmatter', () => {
      const content = `---
name: test-skill
description: A test skill for testing
---

# Skill Content

Instructions here.`;

      const result = parseSkillFrontmatter(content);
      
      assert.ok(result);
      assert.strictEqual(result.name, 'test-skill');
      assert.strictEqual(result.description, 'A test skill for testing');
    });

    test('should handle multiword description', () => {
      const content = `---
name: annotate
description: AI-assisted markdown annotation workflow with interactive review
---

Content`;

      const result = parseSkillFrontmatter(content);
      
      assert.ok(result);
      assert.strictEqual(result.description, 'AI-assisted markdown annotation workflow with interactive review');
    });

    test('should return null for missing frontmatter', () => {
      const content = `# Just Content

No frontmatter here.`;

      const result = parseSkillFrontmatter(content);
      assert.strictEqual(result, null);
    });

    test('should return null for missing name', () => {
      const content = `---
description: Missing name field
---

Content`;

      const result = parseSkillFrontmatter(content);
      assert.strictEqual(result, null);
    });

    test('should return null for missing description', () => {
      const content = `---
name: missing-desc
---

Content`;

      const result = parseSkillFrontmatter(content);
      assert.strictEqual(result, null);
    });

    test('should handle frontmatter with extra fields', () => {
      const content = `---
name: extra-fields
description: Has extra fields
version: 1.0.0
author: Test Author
---

Content`;

      const result = parseSkillFrontmatter(content);
      
      assert.ok(result);
      assert.strictEqual(result.name, 'extra-fields');
      assert.strictEqual(result.description, 'Has extra fields');
    });

    test('should handle names with hyphens', () => {
      const content = `---
name: my-cool-skill
description: Cool skill
---

Content`;

      const result = parseSkillFrontmatter(content);
      
      assert.ok(result);
      assert.strictEqual(result.name, 'my-cool-skill');
    });
  });
});
