/**
 * Shared annotation insertion utilities
 * 
 * SF-6: Extract shared insertion logic to avoid duplication between
 * annotateCommand.ts and annotateWithStatusCommand.ts
 */

import * as vscode from 'vscode';
import type { Annotation, Verdict } from '../../annotations/types';
import { generateId, formatAnnotation } from '../../annotations/writer';
import { truncateForDisplay } from './truncate';

/**
 * Parameters for inserting an annotation
 */
export interface InsertAnnotationParams {
  editor: vscode.TextEditor;
  selection: vscode.Selection;
  status: Verdict;
  comment?: string;
}

/**
 * Insert an annotation after the given selection
 * 
 * Handles:
 * - Building the annotation object
 * - Formatting the annotation block
 * - Inserting at the correct position
 * - Moving cursor to after the annotation
 * 
 * @param params The insertion parameters
 * @returns true if insertion was successful, false otherwise
 */
export async function insertAnnotation(params: InsertAnnotationParams): Promise<boolean> {
  const { editor, selection, status, comment } = params;
  
  // Get the selected text for the Re field
  const selectedText = editor.document.getText(selection);
  const truncatedRe = truncateForDisplay(selectedText);
  
  // Build the annotation
  const annotation: Annotation = {
    id: generateId(),
    status,
    re: truncatedRe,
    comment: comment || undefined, // Don't include empty string
  };
  
  // Format the annotation block
  const annotationBlock = formatAnnotation(annotation);
  
  // Calculate insertion position (after the selection's end line)
  const insertLine = selection.end.line;
  
  // Validate line number before accessing
  const maxLine = editor.document.lineCount - 1;
  const clampedInsertLine = Math.max(0, Math.min(insertLine, maxLine));
  
  // Apply the edit
  const success = await editor.edit((editBuilder) => {
    // Insert the annotation after the selection line
    const endOfLine = editor.document.lineAt(clampedInsertLine).range.end;
    editBuilder.insert(endOfLine, '\n\n' + annotationBlock + '\n');
  });
  
  if (success) {
    // Move cursor to after the inserted annotation for better UX
    // This also clears the selection, which hides any hover
    const newLineCount = annotationBlock.split('\n').length + 2; // +2 for blank lines
    const newPosition = new vscode.Position(clampedInsertLine + newLineCount, 0);
    editor.selection = new vscode.Selection(newPosition, newPosition);
  }
  
  return success;
}
