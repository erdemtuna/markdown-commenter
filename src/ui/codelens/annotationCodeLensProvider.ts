/**
 * CodeLens provider for annotation blocks
 * 
 * Displays status indicators above annotation blocks with click-to-reveal functionality.
 * Uses debounced refresh to handle rapid document changes without blocking the editor.
 */

import * as vscode from 'vscode';
import { findAnnotations } from '../../annotations/parser';
import type { AnnotatedBlock } from '../../annotations/types';
import { STATUS_CODICONS, COMMANDS, DEBOUNCE_DELAY_MS, LARGE_FILE_THRESHOLD } from '../constants';

/**
 * CodeLens provider that shows status indicators above annotation blocks
 */
export class AnnotationCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private _debounceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Trigger a debounced refresh of CodeLenses
   * Call this when document content changes
   */
  public triggerRefresh(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._debounceTimer = setTimeout(() => {
      this._onDidChangeCodeLenses.fire();
    }, DEBOUNCE_DELAY_MS);
  }

  /**
   * Provide CodeLenses for the given document
   * 
   * Creates a CodeLens above each annotation block showing the status
   * with a click action to reveal the annotation.
   */
  provideCodeLenses(
    document: vscode.TextDocument,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // Only provide CodeLenses for markdown files
    if (document.languageId !== 'markdown') {
      return [];
    }

    // SF-5: Skip large files to prevent performance issues
    const content = document.getText();
    const fileSize = Buffer.byteLength(content, 'utf8');
    if (fileSize > LARGE_FILE_THRESHOLD) {
      return [];
    }

    const blocks = findAnnotations(content);

    return blocks.map((block) => this.createCodeLens(block, document));
  }

  /**
   * Create a CodeLens for an annotation block
   * 
   * @param block The annotation block
   * @param document The document containing the block
   * @returns A CodeLens positioned above the annotation block
   */
  private createCodeLens(
    block: AnnotatedBlock,
    document: vscode.TextDocument
  ): vscode.CodeLens {
    // Position CodeLens on the line BEFORE the annotation block
    // Clamp to 0 if the annotation is at the start of the document
    const codeLensLine = Math.max(0, block.startLine - 1);
    
    // Create range for the CodeLens (just the start of the line)
    const range = new vscode.Range(codeLensLine, 0, codeLensLine, 0);

    // Get the codicon for the status
    const statusIcon = STATUS_CODICONS[block.annotation.status] || '$(comment)';
    
    // Build the title: icon + status text
    const title = `${statusIcon} ${block.annotation.status}`;

    // Create the CodeLens with reveal command
    return new vscode.CodeLens(range, {
      title,
      command: COMMANDS.REVEAL_ANNOTATION,
      arguments: [block, document.uri],
      tooltip: `Click to reveal annotation (ID: ${block.annotation.id})`,
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._onDidChangeCodeLenses.dispose();
  }
}

/**
 * Register the CodeLens provider with VS Code
 * 
 * @param provider The CodeLens provider instance
 * @returns Disposable for the registered provider
 */
export function registerCodeLensProvider(
  provider: AnnotationCodeLensProvider
): vscode.Disposable {
  return vscode.languages.registerCodeLensProvider(
    { language: 'markdown', scheme: 'file' },
    provider
  );
}
