import * as assert from 'assert';
import { 
  processConditionalBlocks, 
  hasConditionalBlocks, 
  getEnvironmentsInContent 
} from '../../../agents/agentTemplateRenderer';

suite('Agent Template Renderer Test Suite', () => {
  suite('processConditionalBlocks', () => {
    test('should keep vscode content and remove cli content for vscode environment', () => {
      const content = `# Header

{{#vscode}}
VS Code specific content
{{/vscode}}

{{#cli}}
CLI specific content
{{/cli}}

Shared content`;

      const result = processConditionalBlocks(content, 'vscode');
      
      assert.ok(result.includes('VS Code specific content'));
      assert.ok(!result.includes('CLI specific content'));
      assert.ok(result.includes('Shared content'));
      assert.ok(!result.includes('{{#vscode}}'));
      assert.ok(!result.includes('{{/vscode}}'));
    });

    test('should keep cli content and remove vscode content for cli environment', () => {
      const content = `# Header

{{#vscode}}
VS Code specific content
{{/vscode}}

{{#cli}}
CLI specific content
{{/cli}}

Shared content`;

      const result = processConditionalBlocks(content, 'cli');
      
      assert.ok(!result.includes('VS Code specific content'));
      assert.ok(result.includes('CLI specific content'));
      assert.ok(result.includes('Shared content'));
      assert.ok(!result.includes('{{#cli}}'));
      assert.ok(!result.includes('{{/cli}}'));
    });

    test('should handle content with only vscode blocks', () => {
      const content = `Before

{{#vscode}}
Only for VS Code
{{/vscode}}

After`;

      const vscodeResult = processConditionalBlocks(content, 'vscode');
      const cliResult = processConditionalBlocks(content, 'cli');
      
      assert.ok(vscodeResult.includes('Only for VS Code'));
      assert.ok(!cliResult.includes('Only for VS Code'));
    });

    test('should handle content with only cli blocks', () => {
      const content = `Before

{{#cli}}
Only for CLI
{{/cli}}

After`;

      const vscodeResult = processConditionalBlocks(content, 'vscode');
      const cliResult = processConditionalBlocks(content, 'cli');
      
      assert.ok(!vscodeResult.includes('Only for CLI'));
      assert.ok(cliResult.includes('Only for CLI'));
    });

    test('should handle multiple blocks of same type', () => {
      const content = `{{#vscode}}
First VS Code block
{{/vscode}}

Middle

{{#vscode}}
Second VS Code block
{{/vscode}}`;

      const result = processConditionalBlocks(content, 'vscode');
      
      assert.ok(result.includes('First VS Code block'));
      assert.ok(result.includes('Second VS Code block'));
      assert.ok(result.includes('Middle'));
    });

    test('should handle multiline content in blocks', () => {
      const content = `{{#cli}}
Line 1
Line 2
Line 3
{{/cli}}`;

      const result = processConditionalBlocks(content, 'cli');
      
      assert.ok(result.includes('Line 1'));
      assert.ok(result.includes('Line 2'));
      assert.ok(result.includes('Line 3'));
    });

    test('should not leave excessive blank lines', () => {
      const content = `Header

{{#cli}}
CLI content
{{/cli}}

{{#vscode}}
VS Code content
{{/vscode}}

Footer`;

      const result = processConditionalBlocks(content, 'vscode');
      
      // Should not have more than 2 consecutive newlines
      assert.ok(!result.includes('\n\n\n'));
    });

    test('should handle content with no conditional blocks', () => {
      const content = `# Plain Content

No conditional blocks here.`;

      const vscodeResult = processConditionalBlocks(content, 'vscode');
      const cliResult = processConditionalBlocks(content, 'cli');
      
      assert.ok(vscodeResult.includes('Plain Content'));
      assert.ok(cliResult.includes('Plain Content'));
    });
  });

  suite('hasConditionalBlocks', () => {
    test('should return true for content with vscode blocks', () => {
      const content = '{{#vscode}}content{{/vscode}}';
      assert.strictEqual(hasConditionalBlocks(content), true);
    });

    test('should return true for content with cli blocks', () => {
      const content = '{{#cli}}content{{/cli}}';
      assert.strictEqual(hasConditionalBlocks(content), true);
    });

    test('should return false for content without blocks', () => {
      const content = 'Plain content with no blocks';
      assert.strictEqual(hasConditionalBlocks(content), false);
    });
  });

  suite('getEnvironmentsInContent', () => {
    test('should return both environments when both present', () => {
      const content = `{{#vscode}}vs{{/vscode}} {{#cli}}cli{{/cli}}`;
      const result = getEnvironmentsInContent(content);
      
      assert.ok(result.includes('vscode'));
      assert.ok(result.includes('cli'));
      assert.strictEqual(result.length, 2);
    });

    test('should return only vscode when only vscode present', () => {
      const content = '{{#vscode}}content{{/vscode}}';
      const result = getEnvironmentsInContent(content);
      
      assert.deepStrictEqual(result, ['vscode']);
    });

    test('should return only cli when only cli present', () => {
      const content = '{{#cli}}content{{/cli}}';
      const result = getEnvironmentsInContent(content);
      
      assert.deepStrictEqual(result, ['cli']);
    });

    test('should return empty array when no blocks', () => {
      const content = 'No conditional content';
      const result = getEnvironmentsInContent(content);
      
      assert.deepStrictEqual(result, []);
    });
  });
});
