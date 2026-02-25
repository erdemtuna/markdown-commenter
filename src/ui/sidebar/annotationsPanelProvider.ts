/**
 * Webview-based sidebar panel provider for displaying annotations.
 * 
 * Displays all annotations in the current markdown file with:
 * - Status icon (colored)
 * - Annotation ID
 * - Truncated reference/comment preview
 * - Click-to-navigate functionality
 * 
 * Updates when:
 * - Active editor changes (immediate)
 * - Document content changes (debounced 300ms)
 */

import * as vscode from 'vscode';
import { AnnotatedBlock } from '../../annotations/types';
import { findAnnotations } from '../../annotations';
import { VIEWS, COMMANDS, DEBOUNCE_DELAY_MS } from '../constants';
import { truncateForDisplay } from '../utils';

/**
 * Serializable annotation data sent to webview
 */
interface WebviewAnnotation {
  id: string;
  status: string;
  displayText: string;
  startLine: number;
  endLine: number;
}

/**
 * Messages sent from webview to extension
 */
interface WebviewMessage {
  command: 'navigateTo';
  startLine: number;
  endLine: number;
}

/**
 * WebviewViewProvider for the Annotations sidebar panel.
 * 
 * Implements VS Code's WebviewViewProvider interface to create a webview
 * in the Explorer sidebar that lists all annotations in the current file.
 */
export class AnnotationsPanelProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = VIEWS.ANNOTATIONS_PANEL;
  
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  private _debounceTimer?: NodeJS.Timeout;
  
  constructor(private readonly _extensionUri: vscode.Uri) {}
  
  /**
   * Called when the webview view is first resolved.
   * Sets up the webview options, HTML content, and message handling.
   */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'sidebar', 'webview'),
      ],
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // Handle messages from webview with runtime validation
    this._disposables.push(
      webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
        if (message.command === 'navigateTo' &&
            typeof message.startLine === 'number' &&
            typeof message.endLine === 'number') {
          this._navigateToAnnotation(message.startLine, message.endLine);
        }
      })
    );
    
    // Initial update
    this._updateForCurrentEditor();
  }
  
  /**
   * Update the webview with annotations from the given document.
   * Called by extension.ts when document changes or editor switches.
   */
  public updateAnnotations(document: vscode.TextDocument | undefined): void {
    if (!this._view) {
      return;
    }
    
    // Check if we have a valid markdown document
    if (!document || document.languageId !== 'markdown') {
      this._view.webview.postMessage({
        type: 'setPlaceholder',
        message: 'Open a markdown file to see annotations',
      });
      return;
    }
    
    try {
      const content = document.getText();
      const blocks = findAnnotations(content);
      
      if (blocks.length === 0) {
        this._view.webview.postMessage({
          type: 'setPlaceholder',
          message: 'No annotations in this file',
        });
        return;
      }
      
      // Convert to webview-friendly format
      const webviewAnnotations: WebviewAnnotation[] = blocks.map(block => ({
        id: block.annotation.id,
        status: block.annotation.status,
        displayText: this._getDisplayText(block),
        startLine: block.startLine,
        endLine: block.endLine,
      }));
      
      this._view.webview.postMessage({
        type: 'updateAnnotations',
        annotations: webviewAnnotations,
      });
    } catch (error) {
      // Handle file read errors gracefully (NFR-4)
      console.error('Failed to parse annotations:', error);
      this._view.webview.postMessage({
        type: 'setPlaceholder',
        message: 'Error reading annotations',
      });
    }
  }
  
  /**
   * Trigger a debounced refresh of the annotations panel.
   * Called on document change events.
   */
  public triggerDebouncedRefresh(document: vscode.TextDocument): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    
    this._debounceTimer = setTimeout(() => {
      this.updateAnnotations(document);
    }, DEBOUNCE_DELAY_MS);
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
  
  /**
   * Get display text for an annotation (truncated reference or comment)
   */
  private _getDisplayText(block: AnnotatedBlock): string {
    const annotation = block.annotation;
    
    // Prefer 're' field, fall back to comment
    if (annotation.re) {
      return truncateForDisplay(annotation.re, 50);
    }
    if (annotation.comment) {
      return truncateForDisplay(annotation.comment, 50);
    }
    return '(no description)';
  }
  
  /**
   * Navigate to and select an annotation in the editor
   */
  private _navigateToAnnotation(startLine: number, endLine: number): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    
    // Create selection spanning the entire annotation block
    const startPos = new vscode.Position(startLine, 0);
    const endLineText = editor.document.lineAt(endLine);
    const endPos = new vscode.Position(endLine, endLineText.text.length);
    
    // Reveal and select
    editor.selection = new vscode.Selection(startPos, endPos);
    editor.revealRange(
      new vscode.Range(startPos, endPos),
      vscode.TextEditorRevealType.InCenterIfOutsideViewport
    );
  }
  
  /**
   * Update panel for currently active editor
   */
  private _updateForCurrentEditor(): void {
    const editor = vscode.window.activeTextEditor;
    this.updateAnnotations(editor?.document);
  }
  
  /**
   * Generate the HTML content for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get URIs for scripts and styles
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'sidebar', 'webview', 'panel.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'ui', 'sidebar', 'webview', 'panel.js')
    );
    
    // Generate nonce for Content Security Policy
    const nonce = this._getNonce();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Annotations</title>
</head>
<body>
  <div id="annotations-container">
    <div id="placeholder" class="placeholder">
      <span class="codicon codicon-comment-discussion"></span>
      <p>Open a markdown file to see annotations</p>
    </div>
    <ul id="annotations-list" class="annotations-list hidden" role="listbox" aria-label="Annotations">
    </ul>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
  
  /**
   * Generate a random nonce for CSP
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

/**
 * Register the webview view provider
 */
export function registerAnnotationsPanelProvider(
  context: vscode.ExtensionContext
): AnnotationsPanelProvider {
  const provider = new AnnotationsPanelProvider(context.extensionUri);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AnnotationsPanelProvider.viewType,
      provider
    )
  );
  
  context.subscriptions.push(provider);
  
  return provider;
}

/**
 * Register the focus annotations view command
 */
export function registerFocusAnnotationsViewCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(COMMANDS.FOCUS_ANNOTATIONS_VIEW, () => {
    // Focus the annotations view in the sidebar
    vscode.commands.executeCommand(`${VIEWS.ANNOTATIONS_PANEL}.focus`);
  });
}
