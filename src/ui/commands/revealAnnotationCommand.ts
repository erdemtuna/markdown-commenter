/**
 * Reveal annotation command implementation
 * 
 * Scrolls to and selects an annotation block in the editor.
 * Used as the click action for CodeLens items.
 */

import * as vscode from 'vscode';
import type { AnnotatedBlock } from '../../annotations/types';
import { COMMANDS } from '../constants';

/**
 * Execute the reveal annotation command
 * 
 * Scrolls the editor to the annotation block and selects it.
 * 
 * @param block The annotation block to reveal
 * @param documentUri Optional URI of the document containing the annotation
 */
export async function executeRevealAnnotationCommand(
  block: AnnotatedBlock,
  documentUri?: vscode.Uri
): Promise<void> {
  if (!block) {
    return;
  }

  // Find or open the document if URI is provided
  let editor = vscode.window.activeTextEditor;
  
  if (documentUri && editor?.document.uri.toString() !== documentUri.toString()) {
    // Need to open a different document
    try {
      const document = await vscode.workspace.openTextDocument(documentUri);
      editor = await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open document: ${error}`);
      return;
    }
  }

  if (!editor) {
    vscode.window.showInformationMessage('No active editor to reveal annotation');
    return;
  }

  // Create a range for the entire annotation block
  // Validate line numbers to handle stale annotation data after document edits
  const maxLine = editor.document.lineCount - 1;
  const startLine = Math.max(0, Math.min(block.startLine, maxLine));
  const endLine = Math.max(startLine, Math.min(block.endLine, maxLine));
  
  // Get the full range of the block
  const startPosition = new vscode.Position(startLine, 0);
  const endPosition = new vscode.Position(
    endLine,
    editor.document.lineAt(endLine).text.length
  );
  const blockRange = new vscode.Range(startPosition, endPosition);

  // Select the annotation block
  editor.selection = new vscode.Selection(startPosition, endPosition);

  // Scroll to reveal the selection (centered in viewport)
  editor.revealRange(blockRange, vscode.TextEditorRevealType.InCenter);
}

/**
 * Register the reveal annotation command with VS Code
 * 
 * @returns Disposable for the registered command
 */
export function registerRevealAnnotationCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    COMMANDS.REVEAL_ANNOTATION,
    executeRevealAnnotationCommand
  );
}
