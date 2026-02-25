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

  // SF-7: Add command registration tests
  test('Annotate command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('markdown-commenter.annotate'),
      'annotate command should be registered'
    );
  });

  test('AnnotateWithStatus command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('markdown-commenter.annotateWithStatus'),
      'annotateWithStatus command should be registered'
    );
  });

  test('RevealAnnotation command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('markdown-commenter.revealAnnotation'),
      'revealAnnotation command should be registered'
    );
  });

  test('FocusAnnotationsView command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('markdown-commenter.focusAnnotationsView'),
      'focusAnnotationsView command should be registered'
    );
  });
});
