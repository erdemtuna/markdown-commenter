/**
 * Status bar item showing annotation count for the current markdown file.
 * 
 * Features:
 * - Shows "$(comment) N annotations" when a markdown file is active
 * - Hides when non-markdown file is active
 * - Click to reveal and focus the Annotations sidebar panel
 * - Updates on document changes (via shared event listeners)
 */

import * as vscode from 'vscode';
import { findAnnotations } from '../../annotations';
import { COMMANDS } from '../constants';

/**
 * Manages the status bar item for displaying annotation count.
 * 
 * The status bar item:
 * - Aligned to the right side of the status bar
 * - Shows annotation count with comment icon
 * - Clickable to focus the Annotations sidebar panel
 * - Auto-hides for non-markdown files
 */
export class AnnotationStatusBar implements vscode.Disposable {
  private readonly _statusBarItem: vscode.StatusBarItem;
  
  constructor() {
    // Create status bar item aligned to the right
    this._statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100 // Priority - higher numbers = further left in the right section
    );
    
    // Set up click command to focus the Annotations panel
    this._statusBarItem.command = COMMANDS.FOCUS_ANNOTATIONS_VIEW;
    this._statusBarItem.tooltip = 'Click to show Annotations panel';
  }
  
  /**
   * Update the status bar with the annotation count from the given document.
   * Shows the count for markdown files, hides for other file types.
   * 
   * @param document - The document to count annotations in, or undefined
   */
  public update(document: vscode.TextDocument | undefined): void {
    // Hide if no document or not a markdown file
    if (!document || document.languageId !== 'markdown') {
      this.hide();
      return;
    }
    
    try {
      const content = document.getText();
      const blocks = findAnnotations(content);
      const count = blocks.length;
      
      // Update status bar text with codicon and count
      // Use singular/plural form for better UX
      const label = count === 1 ? 'annotation' : 'annotations';
      this._statusBarItem.text = `$(comment) ${count} ${label}`;
      this._statusBarItem.show();
    } catch (error) {
      // On error, hide the status bar rather than showing stale data
      console.error('Failed to count annotations for status bar:', error);
      this.hide();
    }
  }
  
  /**
   * Hide the status bar item.
   * Called when switching to non-markdown files.
   */
  public hide(): void {
    this._statusBarItem.hide();
  }
  
  /**
   * Dispose of the status bar item.
   */
  dispose(): void {
    this._statusBarItem.dispose();
  }
}
