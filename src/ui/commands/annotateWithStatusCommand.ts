/**
 * Annotate with pre-selected status command
 * 
 * This command is invoked from the hover UI with a pre-selected status.
 * It prompts for an optional comment and inserts the annotation.
 */

import * as vscode from 'vscode';
import type { Annotation } from '../../annotations/types';
import { generateId, formatAnnotation } from '../../annotations/writer';
import { truncateForDisplay } from '../utils/truncate';
import { COMMANDS } from '../constants';
import type { AnnotateWithStatusArgs } from '../hover/annotationHoverProvider';

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

  // Reconstruct the selection from the command arguments
  const selection = new vscode.Selection(
    new vscode.Position(args.startLine, args.startChar),
    new vscode.Position(args.endLine, args.endChar)
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

  // Get the selected text for the Re field
  const selectedText = editor.document.getText(selection);
  const truncatedRe = truncateForDisplay(selectedText);

  // Build the annotation
  const annotation: Annotation = {
    id: generateId(),
    status: args.status,
    re: truncatedRe,
    comment: comment || undefined, // Don't include empty string
  };

  // Format the annotation block
  const annotationBlock = formatAnnotation(annotation);

  // Calculate insertion position (after the selection's end line)
  const insertLine = selection.end.line;

  // Apply the edit
  const success = await editor.edit((editBuilder) => {
    // Insert the annotation after the selection line
    const endOfLine = editor.document.lineAt(insertLine).range.end;
    editBuilder.insert(endOfLine, '\n\n' + annotationBlock + '\n');
  });

  if (success) {
    // Move cursor to after the inserted annotation for better UX
    // This also clears the selection, which hides the hover
    const newLineCount = annotationBlock.split('\n').length + 2; // +2 for blank lines
    const newPosition = new vscode.Position(insertLine + newLineCount, 0);
    editor.selection = new vscode.Selection(newPosition, newPosition);
  }
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
