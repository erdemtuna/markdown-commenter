# Spec: Extension UI Components

## Overview

Add interactive UI elements to the Markdown Commenter VS Code extension, enabling users to annotate markdown files through a visual interface. This builds on the existing core annotation library (`src/annotations/`) to provide three complementary UI surfaces:

1. **Quick-pick UI** — Command-triggered annotation creation
2. **CodeLens** — Inline status indicators above annotated lines  
3. **Sidebar Panel** — File-level annotation list and navigation

**Design principle**: Use Fluent 2 Web Components (`@fluentui/web-components` + `@fluentui/tokens`) for a sleek, modern interface that matches VS Code's native aesthetics. All UI should feel native to VS Code, not bolted-on.

---

## User Stories

### Quick-pick UI

**US-1**: As a user reviewing a markdown file, I want to select text and invoke a command to annotate it, so I can record my verdict without leaving the editor.

**US-2**: As a user, I want to choose a status (Accept/Reject/Skip/Question) from a quick-pick list, so I can quickly categorize my response.

**US-3**: As a user, I want to optionally add a comment after selecting a status, so I can explain my reasoning.

**US-4**: As a user, I want the annotation to appear immediately after the line containing my selection, so I can see it in context.

### Hover-based Annotation UI

**US-12**: As a user, I want to see a hover near my text selection with clickable status buttons, so I can annotate contextually without keyboard shortcuts.

**US-13**: As a user, I want clicking a status button in the hover to either insert the annotation immediately (for quick verdicts) or show a comment input (for detailed annotations), so I can choose my workflow.

**US-14**: As a user, I want the hover to remain visible while I interact with it, so I have time to click the desired button.

### CodeLens

**US-5**: As a user, I want to see a visual indicator above lines that have annotations, so I can quickly scan what's been reviewed.

**US-6**: As a user, I want the CodeLens to show the annotation status (Accept/Reject/Skip/Question), so I can understand the verdict at a glance.

**US-7**: As a user, I want to click the CodeLens to navigate to or expand the annotation details, so I can read the full comment.

### Sidebar Panel

**US-8**: As a user, I want to see a list of all annotations in the current file, so I can get an overview of review progress.

**US-9**: As a user, I want to click an annotation in the sidebar to jump to its location in the file, so I can navigate quickly.

**US-10**: As a user, I want to see annotation metadata (status, ID, truncated comment) in the sidebar list, so I can understand each item without navigating.

**US-11**: As a user, I want the sidebar to update automatically when I add or remove annotations, so the list stays current.

---

## Functional Requirements

### FR-1: Quick-pick Annotation Command

**Description**: Register a VS Code command that presents a Quick-pick UI for creating annotations on selected text.

**Acceptance Criteria**:
- [ ] Command `markdown-commenter.annotate` is registered and appears in Command Palette
- [ ] Command is bound to a keyboard shortcut (configurable, default: `Ctrl+Shift+A` / `Cmd+Shift+A`)
- [ ] When invoked with text selected in a markdown file:
  - Shows Quick-pick with status options: Accept, Reject, Skip, Question
  - Each option shows appropriate icon (✓, ✗, ⏭, ?)
  - After status selection, shows input box for optional comment
  - Input box has placeholder text explaining it's optional
  - Pressing Enter with empty input proceeds without comment
  - Pressing Escape cancels the entire operation
- [ ] On completion, inserts annotation block after the line containing selection end
- [ ] Selection of >50 characters triggers truncation for `Re` field (50 chars + "...")
- [ ] When invoked without selection or in non-markdown file, shows informative message
- [ ] Quick-pick closes immediately after selection (single annotation per invocation)

### FR-1B: Hover-based Annotation UI

**Description**: Display a contextual hover near text selection with clickable status buttons for quick annotation.

**Acceptance Criteria**:
- [ ] `HoverProvider` registered for markdown files
- [ ] When text is selected in a markdown file, hover appears at selection position
- [ ] Hover displays clickable buttons: `✓ Accept | ✗ Reject | ⏭ Skip | ? Question`
- [ ] Each button is a markdown command link that triggers annotation with pre-selected status
- [ ] Clicking a button:
  - Shows Quick-pick for optional comment input only (status already selected)
  - If comment is empty or skipped, annotation is inserted immediately
  - If comment is provided, annotation includes the comment
- [ ] Hover uses VS Code markdown syntax with command URIs
- [ ] Selection range is passed via command arguments to ensure correct text is annotated
- [ ] Existing `Ctrl+Shift+A` flow remains as fallback (unchanged)
- [ ] Hover appears at cursor/selection position (contextual, near the text)

### FR-2: CodeLens Provider

**Description**: Display CodeLens indicators above lines that precede annotation blocks.

**Acceptance Criteria**:
- [ ] CodeLens appears above the line immediately before each `> [!COMMENT]` block
- [ ] CodeLens title shows status with icon: "✓ Accept", "✗ Reject", "⏭ Skip", "? Question"
- [ ] CodeLens is clickable and reveals annotation details in hover or panel
- [ ] CodeLens updates automatically when annotations are added/removed/modified
- [ ] Performance: CodeLens provider is efficient for files with many annotations (lazy evaluation)
- [ ] CodeLens only appears in markdown files (`.md`, `.markdown`)

### FR-3: Sidebar Panel

**Description**: Webview-based sidebar panel showing all annotations in the active markdown file.

**Acceptance Criteria**:
- [ ] Panel appears in VS Code's Explorer sidebar with title "Annotations"
- [ ] Panel has custom icon distinguishing it from other views
- [ ] Panel lists all annotations in document order (top to bottom)
- [ ] Each list item shows:
  - Status icon (colored: green=Accept, red=Reject, yellow=Skip, blue=Question)
  - Annotation ID
  - Truncated `Re` field or first line of comment (if present)
- [ ] Clicking an item:
  - Scrolls editor to the annotation location
  - Selects/highlights the annotation block
- [ ] Panel updates automatically when:
  - Active editor changes to different markdown file
  - Annotations are added/modified/deleted in current file
- [ ] Panel shows "No annotations" placeholder when file has no annotations
- [ ] Panel shows "Open a markdown file" when no markdown file is active
- [ ] Panel uses Fluent 2 Web Components (`@fluentui/web-components` with `@fluentui/tokens` for theming)

### FR-4: Context Menu Integration

**Description**: Add annotation command to editor context menu for discoverability.

**Acceptance Criteria**:
- [ ] "Add Annotation" appears in editor context menu when right-clicking in markdown files
- [ ] Context menu item is hidden when no text is selected (VS Code menus use show/hide, not disable)
- [ ] Context menu item invokes same flow as Quick-pick command (FR-1)

### FR-5: Status Bar Integration

**Description**: Show annotation count in status bar for quick reference.

**Acceptance Criteria**:
- [ ] Status bar item shows annotation count when markdown file is active
- [ ] Format: "$(comment) N annotations" where N is the count
- [ ] Clicking status bar item opens the Sidebar Panel
- [ ] Status bar item hidden when non-markdown file is active

---

## Non-Functional Requirements

### NFR-1: Visual Design

**Description**: UI must follow VS Code's design language using Fluent 2 Web Components.

**Acceptance Criteria**:
- [ ] Install `@fluentui/web-components` and `@fluentui/tokens` as dependencies
- [ ] Sidebar panel uses Fluent 2 components (e.g., `fluent-data-grid`, `fluent-button`, `fluent-badge`)
- [ ] Colors match VS Code theme (respects light/dark/high-contrast themes)
- [ ] Icons use VS Code's codicon set where available
- [ ] Custom icons (if needed) follow VS Code icon design guidelines
- [ ] No jarring visual differences from native VS Code UI

### NFR-2: Performance

**Description**: UI must remain responsive even with many annotations.

**Acceptance Criteria**:
- [ ] CodeLens provider uses lazy evaluation (no full file parse on every keystroke)
- [ ] Sidebar updates debounced (max once per 300ms during rapid editing)
- [ ] Files with 100+ annotations render sidebar within 500ms
- [ ] No blocking of editor input during annotation operations

### NFR-3: Accessibility

**Description**: UI must be accessible to users with disabilities.

**Acceptance Criteria**:
- [ ] All interactive elements are keyboard-navigable
- [ ] Sidebar panel items have appropriate ARIA labels
- [ ] Status icons have text alternatives (visible in tooltips)
- [ ] High contrast theme support for all UI elements

### NFR-4: Error Handling

**Description**: UI handles edge cases gracefully without crashes.

**Acceptance Criteria**:
- [ ] Malformed annotation blocks don't crash CodeLens or Sidebar
- [ ] File read errors show user-friendly message
- [ ] Large files (>10MB) show warning before processing
- [ ] Concurrent edits handled gracefully (optimistic locking not required)

---

## Technical Constraints

### TC-1: Existing Core Library

Must use the existing annotation library in `src/annotations/`:
- `types.ts`: `Annotation`, `AnnotatedBlock`, `Verdict` types
- `parser.ts`: `parseAnnotation()`, `findAnnotations()` functions
- `writer.ts`: `generateId()`, `formatAnnotation()`, `insertAnnotation()` functions

No modifications to the core library are in scope (unless bugs are discovered).

### TC-2: VS Code API Versions

- Extension must work with VS Code 1.85.0+ (as per existing `package.json`)
- Use `vscode.languages.registerCodeLensProvider()` for CodeLens
- Use `vscode.window.registerWebviewViewProvider()` for Sidebar

### TC-3: Webview Security

- Sidebar webview must use Content Security Policy (CSP)
- No inline scripts in webview HTML
- Use message passing between extension and webview

---

## Out of Scope

The following are explicitly NOT in scope for this work:

1. **Preview pane selection** — Supporting selection in VS Code's markdown preview requires custom webview or additional research
2. **Annotation editing** — Modifying existing annotations via UI (users can edit markdown directly)
3. **Annotation deletion** — Removing annotations via UI (users can delete markdown directly)
4. **Multi-file annotation view** — Sidebar shows only current file's annotations
5. **Annotation statistics/reports** — No aggregate views across files
6. **Undo/redo integration** — Relies on VS Code's native text undo
7. **Export functionality** — No JSON/CSV export of annotations

---

## Success Criteria

### Minimum Viable Product (MVP)

The feature is considered complete when:

1. [ ] User can invoke annotation command via keyboard shortcut or Command Palette
2. [ ] Quick-pick flow works: status selection → optional comment → annotation inserted
3. [ ] CodeLens displays above all annotation blocks with correct status
4. [ ] Sidebar panel lists all annotations with clickable navigation
5. [ ] All UI respects VS Code theme (light/dark/high contrast)
6. [ ] No regressions in existing functionality (agent installation, skill tool)

### Quality Gates

- [ ] All acceptance criteria in FR-1 through FR-5 are met
- [ ] All acceptance criteria in NFR-1 through NFR-4 are met
- [ ] Extension passes `npm run lint` with no errors
- [ ] Extension compiles with `npm run compile` with no errors
- [ ] Manual testing confirms UI works in:
  - VS Code on macOS
  - VS Code on Windows
  - VS Code on Linux
  - Light theme
  - Dark theme

### Demo Scenario

A successful implementation should support this workflow:

1. Open a markdown file with AI-generated review content
2. Select a paragraph describing a finding
3. Press `Ctrl+Shift+A` to invoke annotation command
4. Select "Accept" from Quick-pick
5. Enter comment: "Will implement in phase 2"
6. See annotation block appear below the paragraph
7. See CodeLens "✓ Accept" above the annotation
8. See annotation appear in Sidebar panel
9. Click annotation in Sidebar to jump back to it

---

## Glossary

| Term | Definition |
|------|------------|
| Annotation | A structured `> [!COMMENT]` block with ID, status, optional Re field, and optional comment |
| Verdict | One of four status values: Accept, Reject, Skip, Question |
| CodeLens | VS Code feature showing actionable links above lines of code |
| Quick-pick | VS Code's native selection UI (dropdown list) |
| Fluent UI | Microsoft's Fluent 2 design system; `@fluentui/web-components` provides web components with `@fluentui/tokens` for theming |
| Re field | Truncated quote of the annotated text, used for reference durability |

---

## References

- [WorkShaping.md](/WorkShaping.md) — Initial design document with annotation format specification
- [VS Code CodeLens API](https://code.visualstudio.com/api/references/vscode-api#CodeLensProvider)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Fluent 2 Web Components](https://fluent2.microsoft.design/get-started/develop) (`@fluentui/web-components`)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
