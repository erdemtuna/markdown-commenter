# CodeResearch: Extension UI Components

## Executive Summary

The existing extension provides a solid foundation for UI components. The annotation library in `src/annotations/` handles parsing, formatting, and inserting annotations. The extension currently activates on startup, registers a Language Model Tool for Copilot integration, and installs agent files. **No UI components exist yet** — this work adds commands, CodeLens, and a webview sidebar.

---

## 1. Extension Entry Point & Activation

### File: `src/extension.ts`

**Current activation flow**:
```
onStartupFinished → activate() → installAgentsIfNeeded() → registerSkillTool()
```

**Key integration points** for UI components:

| Line | Code | Integration Point |
|------|------|-------------------|
| 13-15 | `activate()` creates `outputChannel` | Add command registration, CodeLens provider, webview provider here |
| 31-32 | `context.subscriptions.push(toolDisposable)` | Pattern for registering disposables |

**What needs to be added**:
1. Command registration: `vscode.commands.registerCommand()`
2. CodeLens provider: `vscode.languages.registerCodeLensProvider()`
3. Webview view provider: `vscode.window.registerWebviewViewProvider()`
4. Status bar item: `vscode.window.createStatusBarItem()`
5. Document change listeners for real-time updates

---

## 2. Annotation Library (`src/annotations/`)

### 2.1 Types (`types.ts`)

```typescript
// Line 4
export type Verdict = 'Accept' | 'Reject' | 'Skip' | 'Question';

// Lines 9-18
export interface Annotation {
  id: string;           // 8-char alphanumeric (required)
  status: Verdict;      // User verdict (required)
  re?: string;          // Quoted reference text (optional)
  comment?: string;     // Explanation (optional)
}

// Lines 23-30
export interface AnnotatedBlock {
  annotation: Annotation;
  startLine: number;    // 0-based
  endLine: number;      // 0-based, inclusive
}
```

**UI Usage**:
- `Verdict` → Quick-pick options and CodeLens display
- `AnnotatedBlock.startLine` → CodeLens positioning (display on line before)
- `AnnotatedBlock` array → Sidebar list items

### 2.2 Parser Functions (`parser.ts`)

| Function | Lines | Signature | UI Usage |
|----------|-------|-----------|----------|
| `parseAnnotation()` | 10-86 | `(blockText: string) => Annotation \| null` | Internal to `findAnnotations()` |
| `findAnnotations()` | 93-141 | `(content: string) => AnnotatedBlock[]` | **Primary API for CodeLens & Sidebar** |

**Key implementation details**:
- Regex pattern for annotation start: `/^>\s*\[!COMMENT\]/i` (line 102)
- Returns empty array if no annotations found (safe default)
- Handles malformed blocks gracefully (returns `null` for invalid)

### 2.3 Writer Functions (`writer.ts`)

| Function | Lines | Signature | UI Usage |
|----------|-------|-----------|----------|
| `generateId()` | 7-14 | `() => string` | Generate ID for new annotations |
| `formatAnnotation()` | 21-41 | `(annotation: Annotation) => string` | Format annotation for insertion |
| `insertAnnotation()` | 50-64 | `(content, lineNumber, annotation) => string` | **Insert after Quick-pick completion** |

**Insertion logic** (lines 60-63):
- Inserts annotation after specified line (0-based)
- Adds blank lines before and after for spacing
- Returns full modified content (caller applies edit)

---

## 3. Package.json Configuration

### Current Contributions (lines 22-51)

```json
{
  "contributes": {
    "configuration": { /* promptsDirectory setting */ },
    "languageModelTools": [ /* skill tool */ ]
  }
}
```

### Required Additions for UI

```json
{
  "contributes": {
    "commands": [
      {
        "command": "markdown-commenter.annotate",
        "title": "Add Annotation",
        "icon": "$(comment)"
      }
    ],
    "keybindings": [
      {
        "command": "markdown-commenter.annotate",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a",
        "when": "editorTextFocus && editorLangId == markdown"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "markdown-commenter.annotate",
          "when": "editorLangId == markdown && editorHasSelection",
          "group": "1_modification"
        }
      ]
    },
    "views": {
      "explorer": [
        {
          "type": "webview",
          "id": "markdown-commenter.annotationsView",
          "name": "Annotations"
        }
      ]
    }
  }
}
```

> **Note**: The view is placed in the Explorer sidebar (not a custom activity bar container) per Spec FR-3.

### Dependencies to Add

```json
{
  "dependencies": {
    "@fluentui/web-components": "^3.0.0",
    "@fluentui/tokens": "^1.0.0"
  }
}
```

---

## 4. Source Structure

### Current Structure
```
src/
├── extension.ts              # Entry point
├── annotations/              # Core library ✓
│   ├── types.ts
│   ├── parser.ts
│   ├── writer.ts
│   └── index.ts
├── tools/
│   └── skillTool.ts
├── agents/
│   ├── installer.ts
│   └── ...
└── skills/
    └── skillLoader.ts
```

### Proposed Structure (new files in **bold**)
```
src/
├── extension.ts              # Add registrations
├── annotations/              # No changes
├── **ui/**                   # NEW: UI components
│   ├── **commands/**
│   │   └── **annotateCommand.ts**    # Quick-pick flow
│   ├── **codelens/**
│   │   └── **annotationCodeLensProvider.ts**
│   ├── **sidebar/**
│   │   ├── **annotationsPanelProvider.ts**  # WebviewViewProvider
│   │   └── **webview/**
│   │       ├── **index.html**               # Webview HTML
│   │       ├── **main.ts**                  # Webview TypeScript
│   │       └── **styles.css**               # Webview styles
│   └── **statusbar/**
│       └── **annotationStatusBar.ts**
├── tools/
├── agents/
└── skills/
```

---

## 5. VS Code API Patterns

### 5.1 Command Registration

```typescript
// In extension.ts activate()
const annotateCmd = vscode.commands.registerCommand(
  'markdown-commenter.annotate',
  async () => {
    // Implementation in separate file
    await annotateCommand.execute();
  }
);
context.subscriptions.push(annotateCmd);
```

### 5.2 CodeLens Provider

```typescript
// AnnotationCodeLensProvider.ts
export class AnnotationCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const content = document.getText();
    const blocks = findAnnotations(content);
    
    return blocks.map(block => {
      // CodeLens appears on line BEFORE the annotation
      const line = Math.max(0, block.startLine - 1);
      const range = new vscode.Range(line, 0, line, 0);
      
      return new vscode.CodeLens(range, {
        title: `${getStatusIcon(block.annotation.status)} ${block.annotation.status}`,
        command: 'markdown-commenter.revealAnnotation',
        arguments: [block]
      });
    });
  }
}

// Registration in extension.ts
const codeLensProvider = vscode.languages.registerCodeLensProvider(
  { language: 'markdown', scheme: 'file' },
  new AnnotationCodeLensProvider()
);
```

### 5.3 Webview View Provider (Sidebar)

```typescript
// AnnotationsPanelProvider.ts
export class AnnotationsPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'markdown-commenter.annotationsView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(message => {
      if (message.command === 'navigateTo') {
        this._navigateToAnnotation(message.startLine);
      }
    });
  }

  public updateAnnotations(annotations: AnnotatedBlock[]) {
    if (this._view) {
      this._view.webview.postMessage({ 
        type: 'updateAnnotations', 
        annotations 
      });
    }
  }
}

// Registration in extension.ts
const panelProvider = new AnnotationsPanelProvider(context.extensionUri);
context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    AnnotationsPanelProvider.viewType,
    panelProvider
  )
);
```

### 5.4 Status Bar Item

```typescript
// AnnotationStatusBar.ts
export class AnnotationStatusBar {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'markdown-commenter.focusAnnotationsView';
  }

  public update(count: number) {
    this.statusBarItem.text = `$(comment) ${count} annotation${count !== 1 ? 's' : ''}`;
    this.statusBarItem.show();
  }

  public hide() {
    this.statusBarItem.hide();
  }

  public dispose() {
    this.statusBarItem.dispose();
  }
}
```

### 5.5 Document Change Listeners

```typescript
// For real-time updates
vscode.workspace.onDidChangeTextDocument(event => {
  if (event.document.languageId === 'markdown') {
    // Debounce and refresh
    debouncedRefresh(event.document);
  }
});

vscode.window.onDidChangeActiveTextEditor(editor => {
  if (editor?.document.languageId === 'markdown') {
    refreshUI(editor.document);
  } else {
    hideUI();
  }
});
```

---

## 6. Fluent 2 Web Components Integration

### Installation
```bash
npm install @fluentui/web-components @fluentui/tokens
```

### Setup (in webview JavaScript)
```javascript
import { setTheme } from '@fluentui/web-components';
import { webLightTheme, webDarkTheme } from '@fluentui/tokens';

// Detect VS Code theme from body class or CSS variable
const isDark = document.body.classList.contains('vscode-dark');
setTheme(isDark ? webDarkTheme : webLightTheme);
```

### HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'none'; 
                 style-src ${webview.cspSource} 'unsafe-inline';
                 script-src ${webview.cspSource};">
</head>
<body>
  <!-- Fluent 2 web components are custom elements -->
  <fluent-data-grid id="annotations-grid">
    <fluent-data-grid-row row-type="header">
      <fluent-data-grid-cell grid-column="1">Status</fluent-data-grid-cell>
      <fluent-data-grid-cell grid-column="2">ID</fluent-data-grid-cell>
      <fluent-data-grid-cell grid-column="3">Reference</fluent-data-grid-cell>
    </fluent-data-grid-row>
  </fluent-data-grid>
  <script type="module" src="${mainScriptUri}"></script>
</body>
</html>
```

### VS Code Theme Mapping
```javascript
// Listen for VS Code theme changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.attributeName === 'class') {
      const isDark = document.body.classList.contains('vscode-dark');
      const isHighContrast = document.body.classList.contains('vscode-high-contrast');
      // Map to Fluent themes
      if (isHighContrast) {
        setTheme(webDarkTheme); // or custom high-contrast theme
      } else {
        setTheme(isDark ? webDarkTheme : webLightTheme);
      }
    }
  }
});
observer.observe(document.body, { attributes: true });
```

---

## 7. Quick-pick Flow Implementation

```typescript
// annotateCommand.ts
export async function executeAnnotateCommand() {
  const editor = vscode.window.activeTextEditor;
  
  // Validate context
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showInformationMessage('Open a markdown file to annotate');
    return;
  }
  
  const selection = editor.selection;
  if (selection.isEmpty) {
    vscode.window.showInformationMessage('Select text to annotate');
    return;
  }

  // Status selection
  const statusOptions: vscode.QuickPickItem[] = [
    { label: '$(check) Accept', description: 'Accept this item' },
    { label: '$(x) Reject', description: 'Reject this item' },
    { label: '$(arrow-right) Skip', description: 'Skip for now' },
    { label: '$(question) Question', description: 'Need clarification' }
  ];
  
  const statusPick = await vscode.window.showQuickPick(statusOptions, {
    placeHolder: 'Select annotation status'
  });
  
  if (!statusPick) return; // Cancelled
  
  // Extract status from label
  const status = statusPick.label.split(' ')[1] as Verdict;
  
  // Optional comment
  const comment = await vscode.window.showInputBox({
    prompt: 'Add a comment (optional)',
    placeHolder: 'Press Enter to skip'
  });
  
  if (comment === undefined) return; // Cancelled (not empty string)
  
  // Build annotation
  const selectedText = editor.document.getText(selection);
  const re = selectedText.length > 50 
    ? selectedText.substring(0, 50) + '...'
    : selectedText;
  
  const annotation: Annotation = {
    id: generateId(),
    status,
    re,
    comment: comment || undefined
  };
  
  // Insert annotation
  const lineNumber = selection.end.line;
  const content = editor.document.getText();
  const newContent = insertAnnotation(content, lineNumber, annotation);
  
  // Apply edit
  const fullRange = new vscode.Range(
    0, 0,
    editor.document.lineCount - 1,
    editor.document.lineAt(editor.document.lineCount - 1).text.length
  );
  
  await editor.edit(editBuilder => {
    editBuilder.replace(fullRange, newContent);
  });
}
```

---

## 8. File-Specific References

| Feature | Key Files | Key Lines |
|---------|-----------|-----------|
| Entry point | `src/extension.ts` | 13-38 |
| Type definitions | `src/annotations/types.ts` | 4, 9-18, 23-30 |
| Find annotations | `src/annotations/parser.ts` | 93-141 |
| Insert annotation | `src/annotations/writer.ts` | 50-64 |
| Generate ID | `src/annotations/writer.ts` | 7-14 |
| Format block | `src/annotations/writer.ts` | 21-41 |
| Package config | `package.json` | 22-51 (contributions) |

---

## 9. Testing Considerations

### Manual Testing Scenarios
1. Command invocation with/without selection
2. Quick-pick flow completion and cancellation
3. CodeLens display and click handling
4. Sidebar updates on document change
5. Theme compatibility (light/dark/high-contrast)

### Existing Test Infrastructure
- Test runner: `src/test/runTest.js`
- Framework: Mocha + @vscode/test-electron
- Run with: `npm test`

---

## 10. Documentation Infrastructure

**Current documentation files**:
- `README.md` — Main extension documentation
- `CHANGELOG.md` — Version history

**Updates needed**:
- README.md: Add UI features section, keyboard shortcuts, screenshots
- CHANGELOG.md: Add entry for UI components feature
