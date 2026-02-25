# Extension UI Components

## Overview

This implementation adds interactive UI elements to the Markdown Commenter VS Code extension, enabling users to annotate markdown files through visual interfaces without leaving the editor. Building on the existing annotation library (`src/annotations/`), it provides five complementary UI surfaces:

1. **Quick-pick Command** — Keyboard-triggered annotation creation (`Ctrl+Shift+A`)
2. **Hover UI** — Contextual status buttons near text selection
3. **CodeLens** — Inline status indicators above annotation blocks
4. **Sidebar Panel** — Webview-based annotation list with navigation
5. **Status Bar** — Annotation count with quick access to panel

The design uses Fluent 2 Web Components for the sidebar panel and VS Code's native codicons throughout, ensuring a native look and feel.

## Architecture and Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code Extension                        │
├─────────────────────────────────────────────────────────────┤
│  src/extension.ts                                            │
│  ├── Command Registration (annotate, annotateWithStatus)     │
│  ├── CodeLens Provider Registration                          │
│  ├── Hover Provider Registration                             │
│  ├── Webview Provider Registration                           │
│  ├── Status Bar Creation                                     │
│  └── Document Change Listeners (debounced)                   │
├─────────────────────────────────────────────────────────────┤
│  src/ui/                                                     │
│  ├── commands/     → annotateCommand, revealAnnotation       │
│  ├── codelens/     → AnnotationCodeLensProvider              │
│  ├── hover/        → AnnotationHoverProvider                 │
│  ├── sidebar/      → AnnotationsPanelProvider + webview      │
│  ├── statusbar/    → AnnotationStatusBar                     │
│  ├── constants.ts  → COMMANDS, VIEW_IDS, STATUS_ICONS        │
│  └── utils/        → truncateForRe()                         │
├─────────────────────────────────────────────────────────────┤
│  src/annotations/  (existing, unchanged)                     │
│  ├── parser.ts     → findAnnotations()                       │
│  └── writer.ts     → formatAnnotation(), insertAnnotation()  │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

**1. Fluent 2 Web Components for Sidebar Only**

The sidebar panel uses `@fluentui/web-components` with `@fluentui/tokens` for theming. Other UI surfaces (CodeLens, Quick-pick, Hover) use VS Code's native APIs which automatically respect themes.

**Rationale**: Webviews require custom styling; Fluent 2 provides VS Code-compatible components with built-in theme support. Native VS Code APIs don't need external libraries.

**2. Codicons Over Unicode**

All status indicators use VS Code's codicon set (`$(check)`, `$(x)`, etc.) instead of Unicode symbols.

**Rationale**: Codicons render consistently across platforms and fonts, and automatically adapt to VS Code themes.

**3. Debounced Updates with 300ms Threshold**

Document change listeners use a 300ms debounce for sidebar and CodeLens updates.

**Rationale**: Prevents UI thrashing during rapid typing while keeping updates responsive enough for perceived real-time behavior.

**4. Hover-based Annotation as Primary UX**

The hover UI provides the most contextual annotation experience—buttons appear near the selection.

**Rationale**: Reduces cognitive load by keeping interaction near the focus point; keyboard shortcut remains for power users.

**5. Selection-based Annotation Only**

Annotations require text selection; the `Re` field captures what was reviewed.

**Rationale**: Maintains annotation semantics—each annotation refers to specific content.

### Integration Points

- **Annotation Library**: All UI components use `findAnnotations()` for parsing and `formatAnnotation()`/`insertAnnotation()` for writing
- **VS Code Theme**: Webview detects theme via `document.body.classList` and applies matching Fluent theme
- **Event Bus**: Document changes trigger coordinated updates across CodeLens, Sidebar, and Status Bar via shared debounce logic

## User Guide

### Prerequisites

- VS Code 1.85.0 or later
- Markdown file open in editor

### Basic Usage

**Add Annotation via Keyboard:**
1. Select text in a markdown file
2. Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (macOS)
3. Choose status: Accept, Reject, Skip, or Question
4. Optionally enter a comment
5. Annotation block appears below your selection

**Add Annotation via Hover:**
1. Select text in a markdown file
2. Hover over the selection
3. Click a status button: `✓ Accept`, `✗ Reject`, `⏭ Skip`, or `? Question`
4. Optionally enter a comment
5. Annotation block appears below your selection

**Add Annotation via Context Menu:**
1. Select text in a markdown file
2. Right-click to open context menu
3. Click "Add Annotation"
4. Continue as with keyboard shortcut

**Navigate Annotations:**
- Click CodeLens above an annotation to select it
- Click annotation in Sidebar panel to jump to it
- Click status bar item to reveal Sidebar panel

### Advanced Usage

**Large Files**: Files over 10MB will show a warning before annotation operations (prevents accidental processing of huge files).

**Truncation**: Selections longer than 50 characters are automatically truncated in the `Re` field with "..." suffix.

**High Contrast Mode**: All UI elements support VS Code's high contrast themes for accessibility.

## API Reference

### Key Components

**`src/ui/constants.ts`**
```typescript
export const COMMANDS = {
  ANNOTATE: 'markdown-commenter.annotate',
  ANNOTATE_WITH_STATUS: 'markdown-commenter.annotateWithStatus',
  REVEAL_ANNOTATION: 'markdown-commenter.revealAnnotation',
  FOCUS_ANNOTATIONS_VIEW: 'markdown-commenter.focusAnnotationsView'
};

export const VIEW_IDS = {
  ANNOTATIONS_PANEL: 'markdown-commenter.annotationsView'
};

export const STATUS_ICONS: Record<Verdict, string> = {
  Accept: '$(check)', Reject: '$(x)', Skip: '$(arrow-right)', Question: '$(question)'
};
```

**`src/ui/utils/truncate.ts`**
```typescript
export function truncateForRe(text: string, maxLength = 50): string
```
Truncates text for the annotation `Re` field with ellipsis.

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `markdown-commenter.promptsDirectory` | string | Platform default | Custom directory for agent installation |

### Registered Commands

| Command | Title | Keybinding | Description |
|---------|-------|------------|-------------|
| `markdown-commenter.annotate` | Add Annotation | `Ctrl+Shift+A` | Quick-pick annotation flow |
| `markdown-commenter.annotateWithStatus` | Annotate with Status | — | Direct status annotation (via hover) |
| `markdown-commenter.revealAnnotation` | Reveal Annotation | — | Navigate to annotation (via CodeLens) |
| `markdown-commenter.focusAnnotationsView` | Focus Annotations Panel | — | Show and focus sidebar panel |

## Testing

### How to Test

**Quick-pick Flow:**
1. Open any markdown file
2. Select text
3. `Ctrl+Shift+A` → Select status → Enter comment → Verify annotation appears

**Hover Flow:**
1. Select text in markdown file
2. Hover over selection → Click status button → Verify annotation appears

**CodeLens:**
1. Open file with existing annotations
2. Verify CodeLens appears above each `> [!COMMENT]` block
3. Click CodeLens → Verify editor selects annotation

**Sidebar:**
1. Open markdown file with annotations
2. Verify Annotations panel in Explorer sidebar lists all annotations
3. Click annotation → Verify editor scrolls to it

**Status Bar:**
1. Open markdown file with annotations
2. Verify status bar shows "N annotations"
3. Click status bar → Verify Sidebar panel is revealed

**Theme Testing:**
1. Switch between Light, Dark, and High Contrast themes
2. Verify all UI elements remain visible and readable

### Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| No selection | Shows "Select text to annotate" message |
| Non-markdown file | Shows "Open a markdown file" message |
| File > 10MB | Shows warning before proceeding |
| Malformed annotation block | Skipped by CodeLens/Sidebar (no crash) |
| Rapid editing (10+ changes/sec) | UI updates debounced, no lag |
| 100+ annotations | Sidebar renders within 500ms |
| Empty comment | Annotation inserted without comment field |

## Limitations and Future Work

### Known Limitations

- **Single-file view**: Sidebar shows annotations for current file only, not workspace-wide
- **No edit/delete via UI**: Users edit markdown directly to modify or remove annotations
- **No preview pane support**: Selection in VS Code's markdown preview cannot be annotated
- **No undo integration**: Relies on VS Code's native text undo (works correctly but no custom undo stack)

### Future Work

- Multi-file annotation view in sidebar
- Annotation filtering by status
- Annotation search
- Export annotations to JSON/CSV
- Annotation statistics and progress tracking
