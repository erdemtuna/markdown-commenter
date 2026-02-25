/**
 * Annotate with pre-selected status command
 * 
 * This command is invoked from the hover UI with a pre-selected status.
 * It prompts for an optional comment and inserts the annotation.
 */

import * as vscode from 'vscode';
import { COMMANDS } from '../constants';
import { insertAnnotation } from '../utils';
import type { AnnotateWithStatusArgs } from '../hover/annotationHoverProvider';

/**
 * Validate that a value is a finite number
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Execute the annotate with status command
 * 
 * Invoked from hover UI with pre-selected status and selection range.
 * 
 * @param args Arguments containing status and selection range
 */
export async function executeAnnotateWithStatusCommand(
  args?: AnnotateWithStatusArgs
): Promise<void> {
  // Validate arguments
  if (!args || !args.status) {
    vscode.window.showErrorMessage('Invalid annotation command arguments');
    return;
  }

  // Validate coordinate arguments are finite numbers (MF-4: bounds validation)
  if (!isFiniteNumber(args.startLine) || !isFiniteNumber(args.startChar) ||
      !isFiniteNumber(args.endLine) || !isFiniteNumber(args.endChar)) {
    vscode.window.showErrorMessage('Invalid annotation coordinates');
    return;
  }

  // Get the active editor
  const editor = vscode.window.activeTextEditor;
  
  if (!editor) {
    vscode.window.showInformationMessage('Open a markdown file to add annotations');
    return;
  }

  // Validate it's a markdown file
  if (editor.document.languageId !== 'markdown') {
    vscode.window.showInformationMessage('Annotations can only be added to markdown files');
    return;
  }

  // Clamp coordinates to document bounds (document may have changed since hover rendered)
  const maxLine = editor.document.lineCount - 1;
  const clampedStartLine = Math.max(0, Math.min(args.startLine, maxLine));
  const clampedEndLine = Math.max(clampedStartLine, Math.min(args.endLine, maxLine));
  
  // Clamp character positions to line lengths
  const startLineLength = editor.document.lineAt(clampedStartLine).text.length;
  const endLineLength = editor.document.lineAt(clampedEndLine).text.length;
  const clampedStartChar = Math.max(0, Math.min(args.startChar, startLineLength));
  const clampedEndChar = Math.max(0, Math.min(args.endChar, endLineLength));

  // Reconstruct the selection from the clamped command arguments
  const selection = new vscode.Selection(
    new vscode.Position(clampedStartLine, clampedStartChar),
    new vscode.Position(clampedEndLine, clampedEndChar)
  );

  // Validate the selection is still valid (document may have changed)
  if (selection.isEmpty) {
    vscode.window.showInformationMessage('Selection is no longer valid. Please select text again.');
    return;
  }

  // Show comment input box (status already selected from hover)
  const comment = await vscode.window.showInputBox({
    prompt: `Add comment for "${args.status}" annotation (optional)`,
    placeHolder: 'Press Enter to skip, Escape to cancel',
  });

  if (comment === undefined) {
    // User pressed Escape - cancelled
    return;
  }

  // Use shared insertion helper (SF-6)
  await insertAnnotation({
    editor,
    selection,
    status: args.status,
    comment: comment || undefined,
  });
}

/**
 * Register the annotate with status command with VS Code
 * 
 * @returns Disposable for the registered command
 */
export function registerAnnotateWithStatusCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    COMMANDS.ANNOTATE_WITH_STATUS,
    executeAnnotateWithStatusCommand
  );
}
