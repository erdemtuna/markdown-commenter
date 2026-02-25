# Extension UI Components Implementation Plan

## Overview

Add interactive UI elements to the Markdown Commenter VS Code extension, enabling users to annotate markdown files through visual interfaces. This builds on the existing annotation library (`src/annotations/`) to provide:

1. **Quick-pick command** — Keyboard-triggered annotation creation with status selection and optional comment
2. **CodeLens** — Inline status indicators above annotated lines
3. **Sidebar panel** — Webview-based annotation list with navigation
4. **Supporting UI** — Context menu and status bar integration

Design follows VS Code's native aesthetics using Fluent 2 Web Components (`@fluentui/web-components` + `@fluentui/tokens`).

## Current State Analysis

**Existing infrastructure**:
- Extension entry point (`src/extension.ts:13-38`) activates on startup, registers Language Model Tool
- Annotation library (`src/annotations/`) provides complete parsing (`findAnnotations`), formatting (`formatAnnotation`), and insertion (`insertAnnotation`) APIs
- Types defined: `Verdict`, `Annotation`, `AnnotatedBlock` with line positions
- Package.json has `contributes.languageModelTools` but no commands, views, or keybindings

**Gaps**:
- No commands registered
- No UI components (CodeLens, webview, status bar)
- No `@fluentui/web-components` or `@fluentui/tokens` dependencies
- No document change listeners for real-time updates

**Key constraints**:
- VS Code engine `^1.85.0` (supports all required APIs)
- Must not modify core annotation library (per TC-1)
- Webview requires CSP and message passing (per TC-3)

## Desired End State

**Target state**: Extension provides seamless annotation workflow entirely within VS Code:

1. User selects text → `Ctrl+Shift+A` → Quick-pick → annotation inserted
2. CodeLens shows status above each annotation block
3. Sidebar lists all annotations with click-to-navigate
4. Status bar shows annotation count
5. All UI respects VS Code themes (light/dark/high-contrast)

**Verification approach**:
- Each phase has automated verification (compile, lint)
- Manual testing covers the demo scenario from Spec.md
- Final validation against all FR/NFR acceptance criteria

## What We're NOT Doing

- **Annotation editing/deletion via UI** — Users edit markdown directly (per Spec out-of-scope)
- **Multi-file annotation view** — Sidebar shows current file only
- **Preview pane selection** — Would require custom webview research
- **Annotation statistics/reports** — No aggregate views
- **Undo/redo integration** — Relies on VS Code's native text undo
- **Custom icons** — Using VS Code's codicon set only
- **Unit tests for UI components** — Manual testing per Spec quality gates (UI testing in VS Code extensions requires complex mocking; integration testing via manual verification is standard practice)

## Phase Status

- [x] **Phase 1: Foundation & Package Configuration** - Set up dependencies, commands, views, and keybindings in package.json
- [x] **Phase 2: Quick-pick Annotation Command** - Implement core annotation workflow with status selection and comment input
- [x] **Phase 3: CodeLens Provider** - Display status indicators above annotation blocks with click handling
- [x] **Phase 2B: Hover-based Annotation UI** - Contextual hover with clickable status buttons near text selection
- [x] **Phase 4: Sidebar Panel** - Webview-based annotation list with navigation and real-time updates
- [x] **Phase 5: Status Bar & Polish** - Annotation count display and cross-component integration
- [x] **Phase 6: Documentation** - README, CHANGELOG, and Docs.md updates

## Phase Candidates

<!-- No candidates initially — all scope defined in phases above -->

---

## Phase 1: Foundation & Package Configuration

### Objective
Establish the package infrastructure for UI components: dependencies, command declarations, view contributions, and keybindings.

### Changes Required

- **`package.json`**: Add contributions for commands, keybindings, menus, and views
  - Add `commands` array with `markdown-commenter.annotate` command
  - Add `keybindings` for `Ctrl+Shift+A` / `Cmd+Shift+A` with markdown context
  - Add `menus.editor/context` entry for "Add Annotation" 
  - Add `views.explorer` webview entry for Annotations panel (Explorer sidebar only — no activity bar container)
  - Defer `@fluentui/web-components` + `@fluentui/tokens` installation to Phase 4 (when webview is implemented)

- **Verify core library compatibility**: Confirm `findAnnotations()`, `insertAnnotation()`, `formatAnnotation()` APIs support required UI semantics (insertion after selection line, error tolerance). If gaps exist, plan wrappers in `src/ui/` only (TC-1 constraint).

- **Preserve existing functionality**: Maintain existing Language Model Tool registration in `activate()` — all new registrations are additive.

- **`src/ui/`**: Create directory structure for UI components
  - `src/ui/commands/` — Command implementations
  - `src/ui/codelens/` — CodeLens provider
  - `src/ui/sidebar/` — Webview provider and assets
  - `src/ui/statusbar/` — Status bar item
  - `src/ui/constants.ts` — Shared constants (command IDs, view IDs, status icons)
  - `src/ui/utils/` — Shared utilities (truncation, formatting)

- **Install dependencies**: Run `npm install` after package.json update

### Success Criteria

#### Automated Verification:
- [ ] `npm install` completes without errors
- [ ] `npm run compile` succeeds (no TypeScript errors)
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Command `markdown-commenter.annotate` appears in Command Palette (shows "command not found" until Phase 2 — expected)
- [ ] Keybinding `Ctrl+Shift+A` is registered (visible in Keyboard Shortcuts)
- [ ] "Annotations" view appears in Explorer sidebar (empty until Phase 4)

---

## Phase 2: Quick-pick Annotation Command

### Objective
Implement the core annotation workflow: user selects text, invokes command, chooses status via Quick-pick, optionally adds comment, and annotation is inserted.

### Changes Required

- **`src/ui/constants.ts`**: Define shared constants
  ```typescript
  export const COMMANDS = {
    ANNOTATE: 'markdown-commenter.annotate',
    REVEAL_ANNOTATION: 'markdown-commenter.revealAnnotation',
    FOCUS_ANNOTATIONS_VIEW: 'markdown-commenter.focusAnnotationsView'
  };
  export const STATUS_ICONS: Record<Verdict, string> = {
    Accept: '✓', Reject: '✗', Skip: '⏭', Question: '?'
  };
  ```

- **`src/ui/utils/truncate.ts`**: Shared truncation utility
  - `truncateForRe(text: string, maxLength = 50): string` — truncate with ellipsis for `re` field
  - Used by Quick-pick (insertion) and sidebar (display)

- **`src/ui/commands/annotateCommand.ts`**: Implement Quick-pick flow
  - Validate editor context (markdown file, text selected)
  - Large file warning: if document > 10MB, show warning before proceeding (NFR-4)
  - Show Quick-pick with status options using codicons: `$(check) Accept`, `$(x) Reject`, `$(arrow-right) Skip`, `$(question) Question`
  - Show input box for optional comment
  - Build `Annotation` using `generateId()` from core library
  - Truncate selection using shared utility (50 chars for `re` field)
  - Insert using `insertAnnotation()` from core library (or `formatAnnotation()` + targeted insert for better undo granularity)
  - Apply edit via `TextEditor.edit()`
  - Handle context menu invocation arguments (uri, range) if present — don't rely solely on `activeTextEditor.selection`

- **`src/extension.ts`**: Register command in `activate()`
  - Import and call registration function from `annotateCommand.ts`
  - Add disposable to `context.subscriptions`

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes (existing tests — no regressions)

#### Manual Verification:
- [ ] Invoke via `Ctrl+Shift+A` with text selected in markdown file → Quick-pick appears
- [ ] Quick-pick shows codicon icons (`$(check)`, `$(x)`, etc.) — not Unicode
- [ ] Select "Accept" → Input box appears for comment
- [ ] Enter comment and press Enter → Annotation block inserted after selection
- [ ] Press Escape at status selection → Operation cancelled, no changes
- [ ] Press Escape at comment input → Operation cancelled, no changes
- [ ] Invoke without selection → Informative message shown
- [ ] Invoke in non-markdown file → Informative message shown
- [ ] Right-click with selection → "Add Annotation" appears in context menu
- [ ] Right-click without selection → "Add Annotation" is hidden (not visible)
- [ ] Selection >50 chars → `Re` field shows truncated text with "..."
- [ ] Open file >10MB → Warning shown before annotation operation

---

## Phase 3: CodeLens Provider

### Objective
Display status indicators above annotation blocks with click-to-reveal functionality.

### Changes Required

- **`src/ui/codelens/annotationCodeLensProvider.ts`**: Implement `CodeLensProvider`
  - `provideCodeLenses()`: Parse document with `findAnnotations()`, create CodeLens for each block
  - Handle malformed blocks gracefully (parser returns null — skip those blocks, no crash)
  - Position CodeLens on line before annotation block (`startLine - 1`, clamped to 0)
  - Title format: `{codicon} {status}` (e.g., "$(check) Accept") — use codicons, not Unicode
  - Command on click: reveal annotation details (scroll to block, select it)
  - Implement `onDidChangeCodeLenses` event emitter for refresh triggering
  - **Lazy evaluation**: Only compute for visible editors, throttle refresh on rapid edits (NFR-2)

- **`src/ui/codelens/index.ts`**: Export provider and registration helper

- **`src/extension.ts`**: Register CodeLens provider
  - Use `vscode.languages.registerCodeLensProvider()` with markdown selector
  - Set up document change listener to trigger CodeLens refresh (debounced)
  - Add disposables to subscriptions

- **`src/ui/commands/revealAnnotationCommand.ts`**: Implement reveal command
  - Accept `AnnotatedBlock` as argument
  - Scroll to annotation start line
  - Select the annotation block range

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes (no regressions)

#### Manual Verification:
- [ ] Open markdown file with existing annotations → CodeLens appears above each
- [ ] CodeLens shows codicon-based status icon (e.g., `$(check) Accept`)
- [ ] Click CodeLens → Editor scrolls to and selects the annotation block
- [ ] Add annotation via command → CodeLens appears immediately (within 1 second)
- [ ] Delete annotation text → CodeLens disappears
- [ ] File with no annotations → No CodeLens shown
- [ ] Non-markdown file → No CodeLens shown
- [ ] File with malformed annotation block → CodeLens shows for valid blocks, no crash
- [ ] Rapid editing (10 changes in 1 second) → CodeLens updates without blocking editor

---

## Phase 2B: Hover-based Annotation UI

### Objective
Improve annotation UX by showing a contextual hover near text selection with clickable status buttons. This keeps the interaction near the selection rather than requiring keyboard shortcuts or command palette navigation.

### Changes Required

- **`src/ui/constants.ts`**: Add new command identifier
  ```typescript
  export const COMMANDS = {
    ANNOTATE: 'markdown-commenter.annotate',
    ANNOTATE_WITH_STATUS: 'markdown-commenter.annotateWithStatus', // NEW
    // ... existing
  };
  ```

- **`src/ui/hover/annotationHoverProvider.ts`**: Implement `HoverProvider`
  - `provideHover()`: Generate hover content when text is selected in markdown
  - Build markdown content with command links for each status:
    ```markdown
    [✓ Accept](command:markdown-commenter.annotateWithStatus?{"status":"Accept","startLine":N,"startChar":M,...})
    ```
  - Pass selection range via JSON-encoded command arguments
  - Return `Hover` positioned at selection
  - Return `null` if no selection (hover only when text selected)

- **`src/ui/hover/index.ts`**: Export provider and registration helper

- **`src/ui/commands/annotateWithStatusCommand.ts`**: Implement status-specific annotation
  - Accept `{ status: Verdict, startLine, startChar, endLine, endChar }` arguments
  - Show input box for optional comment only (status already selected)
  - Build annotation with provided status
  - Insert annotation after selection
  - Reuse truncation and insertion logic from `annotateCommand.ts`

- **`package.json`**: Register new command
  ```json
  {
    "command": "markdown-commenter.annotateWithStatus",
    "title": "Annotate with Status",
    "category": "Markdown Commenter"
  }
  ```

- **`src/extension.ts`**: Register hover provider and new command
  - Use `vscode.languages.registerHoverProvider()` with markdown selector
  - Register `annotateWithStatus` command
  - Add disposables to subscriptions

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes (no regressions)

#### Manual Verification:
- [ ] Select text in markdown file → Hover appears with status buttons
- [ ] Hover shows: `✓ Accept | ✗ Reject | ⏭ Skip | ? Question`
- [ ] Click "Accept" → Input box appears for optional comment
- [ ] Enter comment → Annotation inserted with Accept status and comment
- [ ] Press Enter with empty comment → Annotation inserted with Accept status, no comment
- [ ] Press Escape → Operation cancelled
- [ ] Hover buttons work for all statuses (Reject, Skip, Question)
- [ ] Existing `Ctrl+Shift+A` flow still works (unchanged)
- [ ] Hover only appears when text is selected (not on empty cursor)

---

## Phase 4: Sidebar Panel

### Objective
Create a webview-based sidebar panel listing all annotations in the current file with click-to-navigate functionality.

### Changes Required

- **`src/ui/sidebar/annotationsPanelProvider.ts`**: Implement `WebviewViewProvider`
  - `resolveWebviewView()`: Set up webview options, **CSP (Content Security Policy)**, HTML content
  - `updateAnnotations()`: Post message to webview with annotation data
  - Handle `navigateTo` message from webview → reveal annotation in editor
  - Store reference to active webview for updates
  - Handle file read errors gracefully — show user-friendly message (NFR-4)

- **`src/ui/sidebar/webview/`**: Create webview assets
  - **`panel.html`**: HTML structure using Fluent 2 Web Components
    - Import `@fluentui/web-components` and set up theming with `setTheme()` from `@fluentui/tokens`
    - Use VS Code theme detection to map to `webLightTheme` or `webDarkTheme`
    - Use Fluent 2 components: `fluent-data-grid`, `fluent-button`, `fluent-badge` where appropriate
    - Status badge with colored icons using codicons
    - Truncated `re` field or comment preview (use same truncation length as Quick-pick: 50 chars)
    - "No annotations" / "Open a markdown file" placeholders
    - **ARIA labels** for all interactive elements (NFR-3)
    - **Keyboard navigation** support (Tab, Enter to select) (NFR-3)
  - **`panel.css`**: Styles respecting VS Code theme variables (light/dark/high-contrast)
  - **`panel.js`**: Client-side logic (plain JavaScript, no TypeScript compilation needed)
    - Initialize Fluent 2: `import { setTheme } from '@fluentui/web-components'; import { webLightTheme, webDarkTheme } from '@fluentui/tokens';`
    - Detect VS Code theme and call `setTheme(webLightTheme)` or `setTheme(webDarkTheme)`
    - Listen for `updateAnnotations` messages
    - Render annotation rows dynamically
    - Post `navigateTo` message on row click
    - High contrast theme support (NFR-3)

- **`src/ui/sidebar/index.ts`**: Export provider and helpers

- **`src/extension.ts`**: Register webview provider and listeners
  - Use `vscode.window.registerWebviewViewProvider()`
  - **Event triggers for refresh** (explicit per NFR-2):
    - `onDidChangeActiveTextEditor` → immediate refresh
    - `onDidChangeTextDocument` → debounced refresh (**300ms** per NFR-2)
    - Skip refresh if: non-markdown file, webview not visible
  - Hide/show based on active editor language
  - **Performance target**: 100+ annotations render within 500ms (NFR-2)

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes (no regressions)

#### Manual Verification:
- [ ] Open markdown file → Annotations panel shows list of annotations
- [ ] Each item shows: codicon status icon (colored), ID, truncated reference/comment (50 chars)
- [ ] Click annotation item → Editor scrolls to and selects that annotation
- [ ] Add annotation → Sidebar updates within 500ms
- [ ] Delete annotation → Sidebar updates
- [ ] Switch to markdown file with no annotations → "No annotations" placeholder shown
- [ ] Switch to non-markdown file → "Open a markdown file" placeholder shown
- [ ] Test in light theme → Colors appropriate
- [ ] Test in dark theme → Colors appropriate
- [ ] Test in high-contrast theme → Accessible colors, all elements visible
- [ ] Keyboard-only navigation → Can Tab through items and Enter to select (NFR-3)
- [ ] File with 100+ annotations → Sidebar renders within 500ms (NFR-2)
- [ ] File with malformed annotation → Sidebar shows valid annotations, no crash (NFR-4)

---

## Phase 5: Status Bar & Polish

### Objective
Add annotation count to status bar and ensure all components work together seamlessly.

### Changes Required

- **`src/ui/statusbar/annotationStatusBar.ts`**: Implement status bar item
  - Create `StatusBarItem` aligned right
  - Format: `$(comment) N annotations`
  - Click command: focus Annotations sidebar view
  - Show only when markdown file is active
  - Expose `update(count)` and `hide()` methods

- **`src/ui/statusbar/index.ts`**: Export status bar class

- **`src/extension.ts`**: Integrate status bar
  - Create status bar instance in `activate()`
  - Update on editor change and document change (reuse existing listeners)
  - Dispose on deactivation

- **`src/ui/commands/focusAnnotationsViewCommand.ts`**: Implement focus command
  - Use `vscode.commands.executeCommand('workbench.view.extension.markdown-commenter.annotationsView')`

- **Integration polish**:
  - Ensure all listeners use shared debounce logic
  - Verify memory cleanup (all disposables registered)
  - Test component interactions (add annotation → all UI updates)

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] `npm test` passes (no regressions)

#### Manual Verification:
- [ ] Open markdown file with 3 annotations → Status bar shows "$(comment) 3 annotations"
- [ ] Add annotation → Count increments
- [ ] Delete annotation → Count decrements
- [ ] Click status bar item → Annotations sidebar is **revealed and focused** (not just focused)
- [ ] Open non-markdown file → Status bar item hidden
- [ ] Rapid editing (10 changes in 1 second) → UI updates smoothly without lag
- [ ] File with 50+ annotations → All components render correctly
- [ ] Complete demo scenario from Spec.md works end-to-end
- [ ] Existing functionality: Agent installation still works
- [ ] Existing functionality: Language Model Tool (Copilot skill) still works

---

## Phase 6: Documentation

### Objective
Update project documentation to reflect new UI features and create technical reference.

### Changes Required

- **`.paw/work/extension-ui-components/Docs.md`**: Technical reference (load `paw-docs-guidance`)
  - Implementation details for each UI component
  - Webview message protocol documentation
  - Debounce and performance considerations
  - Verification approach summary

- **`README.md`**: User-facing documentation updates
  - Add "Features" section describing UI components
  - Document keyboard shortcut (`Ctrl+Shift+A` / `Cmd+Shift+A`)
  - Add usage instructions for each UI surface
  - Include screenshot(s) showing annotation workflow

- **`CHANGELOG.md`**: Version history entry
  - Add entry for UI components feature
  - List all new capabilities (command, CodeLens, sidebar, status bar)

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` succeeds (no broken imports from doc changes)
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] README clearly explains how to use annotation features
- [ ] CHANGELOG accurately describes what was added
- [ ] Docs.md provides sufficient detail for future maintenance

---

## References

- Issue: none
- Spec: `.paw/work/extension-ui-components/Spec.md`
- Research: `.paw/work/extension-ui-components/CodeResearch.md`
- WorkShaping: `WorkShaping.md`
- VS Code APIs: [CodeLens](https://code.visualstudio.com/api/references/vscode-api#CodeLensProvider), [Webview](https://code.visualstudio.com/api/extension-guides/webview), [Commands](https://code.visualstudio.com/api/references/vscode-api#commands)
- Fluent UI Toolkit: [Fluent 2 Web Components](https://fluent2.microsoft.design/get-started/develop)
