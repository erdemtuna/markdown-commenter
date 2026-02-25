import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Starting extension tests.');

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('erdem-tuna.markdown-commenter');
    assert.ok(extension, 'Extension should be registered');
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('erdem-tuna.markdown-commenter');
    assert.ok(extension, 'Extension should be registered');
    
    if (!extension.isActive) {
      await extension.activate();
    }
    
    assert.ok(extension.isActive, 'Extension should be active');
  });
});
