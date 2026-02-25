/**
 * Quick-pick annotation command implementation
 * 
 * Flow:
 * 1. Validate editor context (markdown file, text selected)
 * 2. Show large file warning if needed
 * 3. Show Quick-pick with status options
 * 4. Show input box for optional comment
 * 5. Build annotation and insert after selection
 */

import * as vscode from 'vscode';
import type { Verdict, Annotation } from '../../annotations/types';
import { generateId, formatAnnotation } from '../../annotations/writer';
import { truncateForDisplay } from '../utils/truncate';
import { STATUS_CODICONS, LARGE_FILE_THRESHOLD, COMMANDS } from '../constants';

/**
 * Quick-pick item with associated verdict value
 */
interface StatusQuickPickItem extends vscode.QuickPickItem {
  verdict: Verdict;
}

/**
 * Status options for the Quick-pick menu
 */
const STATUS_OPTIONS: StatusQuickPickItem[] = [
  { label: `${STATUS_CODICONS.Accept} Accept`, description: 'Accept this item', verdict: 'Accept' },
  { label: `${STATUS_CODICONS.Reject} Reject`, description: 'Reject this item', verdict: 'Reject' },
  { label: `${STATUS_CODICONS.Skip} Skip`, description: 'Skip for now', verdict: 'Skip' },
  { label: `${STATUS_CODICONS.Question} Question`, description: 'Need clarification', verdict: 'Question' },
];

/**
 * Execute the annotate command
 * 
 * Can be invoked via:
 * - Keyboard shortcut (Ctrl+Shift+A)
 * - Command palette
 * - Context menu (passes uri and range arguments)
 * 
 * @param uri Optional URI from context menu invocation
 * @param range Optional range from context menu invocation
 */
export async function executeAnnotateCommand(
  uri?: vscode.Uri,
  range?: vscode.Range
): Promise<void> {
  // Get the active editor
  const editor = vscode.window.activeTextEditor;
  
  // Validate we have an editor
  if (!editor) {
    vscode.window.showInformationMessage('Open a markdown file to add annotations');
    return;
  }

  // Validate it's a markdown file
  if (editor.document.languageId !== 'markdown') {
    vscode.window.showInformationMessage('Annotations can only be added to markdown files');
    return;
  }

  // Determine the selection - prefer context menu arguments if available
  const selection = range
    ? new vscode.Selection(range.start, range.end)
    : editor.selection;

  // Validate we have a selection
  if (selection.isEmpty) {
    vscode.window.showInformationMessage('Select text to annotate');
    return;
  }

  // Large file warning (10MB threshold)
  const fileSize = Buffer.byteLength(editor.document.getText(), 'utf8');
  if (fileSize > LARGE_FILE_THRESHOLD) {
    const proceed = await vscode.window.showWarningMessage(
      `This file is larger than 10MB. Annotation operations may be slow. Continue?`,
      'Yes',
      'No'
    );
    if (proceed !== 'Yes') {
      return;
    }
  }

  // Show status Quick-pick
  const statusPick = await vscode.window.showQuickPick(STATUS_OPTIONS, {
    placeHolder: 'Select annotation status',
    title: 'Add Annotation',
  });

  if (!statusPick) {
    // User pressed Escape - cancelled
    return;
  }

  // Show comment input box
  const comment = await vscode.window.showInputBox({
    prompt: 'Add a comment (optional)',
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
    status: statusPick.verdict,
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
    // We insert at the beginning of the next line with proper spacing
    const endOfLine = editor.document.lineAt(insertLine).range.end;
    editBuilder.insert(endOfLine, '\n\n' + annotationBlock + '\n');
  });

  if (success) {
    // Move cursor to after the inserted annotation for better UX
    const newLineCount = annotationBlock.split('\n').length + 2; // +2 for blank lines
    const newPosition = new vscode.Position(insertLine + newLineCount, 0);
    editor.selection = new vscode.Selection(newPosition, newPosition);
  }
}

/**
 * Register the annotate command with VS Code
 * 
 * @returns Disposable for the registered command
 */
export function registerAnnotateCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    COMMANDS.ANNOTATE,
    executeAnnotateCommand
  );
}
