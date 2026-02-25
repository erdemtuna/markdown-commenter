/**
 * Hover provider for contextual annotation UI
 * 
 * Shows clickable status buttons near text selection for quick annotation.
 * Each button links to the annotateWithStatus command with pre-selected status.
 */

import * as vscode from 'vscode';
import type { Verdict } from '../../annotations/types';
import { STATUS_UNICODE, COMMANDS } from '../constants';

/**
 * Arguments passed to the annotateWithStatus command via hover links
 */
export interface AnnotateWithStatusArgs {
  status: Verdict;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

/**
 * Build a markdown command link for a status button
 */
function buildCommandLink(status: Verdict, selection: vscode.Selection): string {
  const args: AnnotateWithStatusArgs = {
    status,
    startLine: selection.start.line,
    startChar: selection.start.character,
    endLine: selection.end.line,
    endChar: selection.end.character,
  };
  
  // Encode arguments as JSON in the command URI
  const encodedArgs = encodeURIComponent(JSON.stringify(args));
  const icon = STATUS_UNICODE[status];
  
  return `[${icon} ${status}](command:${COMMANDS.ANNOTATE_WITH_STATUS}?${encodedArgs})`;
}

/**
 * Hover provider that shows annotation status buttons for selected text
 */
export class AnnotationHoverProvider implements vscode.HoverProvider {
  /**
   * Provide hover content when text is selected in markdown files
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Get the active editor to check selection
    const editor = vscode.window.activeTextEditor;
    
    // Only show hover if there's an active editor with this document
    if (!editor || editor.document !== document) {
      return null;
    }
    
    // Only show hover if there's a non-empty selection
    const selection = editor.selection;
    if (selection.isEmpty) {
      return null;
    }
    
    // Only show hover if the cursor position is within the selection
    if (!selection.contains(position)) {
      return null;
    }
    
    // Build the hover content with status buttons
    const acceptLink = buildCommandLink('Accept', selection);
    const rejectLink = buildCommandLink('Reject', selection);
    const skipLink = buildCommandLink('Skip', selection);
    const questionLink = buildCommandLink('Question', selection);
    
    const hoverContent = new vscode.MarkdownString(
      `**Annotate:** ${acceptLink} | ${rejectLink} | ${skipLink} | ${questionLink}`
    );
    
    // Enable command links in the markdown
    hoverContent.isTrusted = true;
    
    // Return hover positioned at the selection
    return new vscode.Hover(hoverContent, selection);
  }
}

/**
 * Register the hover provider for markdown files
 * 
 * @returns Disposable for the registered provider
 */
export function registerAnnotationHoverProvider(): vscode.Disposable {
  return vscode.languages.registerHoverProvider(
    { language: 'markdown', scheme: 'file' },
    new AnnotationHoverProvider()
  );
}
