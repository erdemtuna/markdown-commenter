# WorkShaping: Markdown Commenter

## Problem Statement

**Who benefits**: Developers and reviewers who work with AI-generated review artifacts (code reviews, spec reviews, plan reviews) or any structured markdown containing findings/recommendations.

**Problem solved**: Currently, users cannot inline-annotate markdown artifacts with their decisions (accept, reject, defer) or comments. When reviewing AI-generated content, there's no structured way to:
1. Record resolution decisions on individual findings
2. Add contextual notes that downstream processes (human or AI) can parse
3. Track what's been reviewed vs. pending

**Goal**: Enable structured inline annotation of any markdown file, with both manual (VS Code) and AI-assisted (Copilot CLI/Chat) workflows producing identical, parseable output.

---

## Work Breakdown

### Core Functionality

1. **Annotation Format** — GitHub-style callout blocks (`> [!COMMENT]`) with:
   - Short UUID for identity
   - Status: Accept / Reject / Skip / Question
   - Optional `Re` field (truncated quote for partial highlights)
   - Optional freeform comment text

2. **VS Code Extension** — Manual annotation mode:
   - Select text in raw markdown or preview pane
   - Quick-pick UI for status selection + comment input
   - Writes `> [!COMMENT]` block after the line containing selection end
   - CodeLens display above annotated lines
   - Sidebar panel listing all annotations in file

3. **Copilot CLI Skill** — AI-assisted annotation mode:
   - LLM reads markdown file, infers reviewable items (headers, lists, semantic chunks)
   - Presents each item interactively, asks for verdict + optional comment
   - Writes same `> [!COMMENT]` format as VS Code extension

4. **Copilot Chat Agent (VS Code)** — Same as CLI skill but in VS Code's Copilot Chat panel

5. **Shared Parser/Writer Library** — TypeScript library for:
   - Parsing existing `> [!COMMENT]` blocks from markdown
   - Writing new annotation blocks
   - UUID generation
   - Used by both VS Code extension and any tooling

### Supporting Features

- Preview pane highlighting support (if VS Code API allows, may need custom webview)
- Partial highlight detection (triggers `Re` field inclusion)
- Multiple annotations on overlapping text allowed (user responsibility to manage)

---

## Annotation Format Specification

```markdown
> [!COMMENT]
> **ID**: abc123
> **Status**: Accept
> **Re**: "The auth module doesn't handle null resp..."
> Fix with optional chaining. Priority for phase 1.
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `ID` | Yes | Short UUID (e.g., 8 chars) for tracking |
| `Status` | Yes | `Accept` \| `Reject` \| `Skip` \| `Question` |
| `Re` | Conditional | Truncated quote of highlighted text. Include for VS Code partial highlights; omit for Copilot-generated annotations where position is sufficient |
| (body) | Optional | Freeform comment text |

### Status Definitions

| Status | Meaning | Downstream Action |
|--------|---------|-------------------|
| **Accept** | Implement/agree with this item | Proceed with recommendation |
| **Reject** | Do not implement/disagree | Skip this item |
| **Skip** | Defer decision | Revisit later |
| **Question** | Need clarification | Agent should explain further |

### Placement Rule

> Annotation block is inserted on a **new line immediately after the line containing the end of the selection**.

This rule is simple, predictable, and handles all cases (single word, sentence, multi-line) consistently.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Re-annotating same text | Allowed. User can add multiple annotations; managing duplicates is user's responsibility |
| Overlapping highlights | Allowed. Each annotation is atomic and independent |
| Editing annotated file | Annotations may become misaligned. `Re` field provides durability for manual highlights |
| Empty comment | Valid. Status alone is meaningful |
| Preview pane selection | Goal: support it. Implementation depends on VS Code API capabilities |

---

## Architecture Sketch

```
┌─────────────────────────────────────────────────────────────┐
│                     markdown-commenter                       │
│                        (monorepo)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  packages/core   │    │   packages/vscode-extension  │  │
│  │  ──────────────  │    │   ────────────────────────   │  │
│  │  • Parser        │◄───│   • Extension activation     │  │
│  │  • Writer        │    │   • Selection handling       │  │
│  │  • UUID gen      │    │   • Quick-pick UI            │  │
│  │  • Types         │    │   • CodeLens provider        │  │
│  └──────────────────┘    │   • Sidebar panel            │  │
│           ▲              │   • Preview integration      │  │
│           │              └──────────────────────────────┘  │
│           │                                                 │
│  ┌────────┴─────────┐    ┌──────────────────────────────┐  │
│  │  skills/         │    │   agents/                    │  │
│  │  ──────────────  │    │   ────────────────────────   │  │
│  │  annotate.md     │    │   vscode-chat-agent.md       │  │
│  │  (Copilot CLI)   │    │   (Copilot Chat in VS Code)  │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Purpose |
|-----------|---------|
| `packages/core` | Shared TypeScript library — annotation parsing, writing, types |
| `packages/vscode-extension` | VS Code extension for manual annotation |
| `skills/annotate.md` | Copilot CLI skill file for AI-assisted annotation |
| `agents/vscode-chat-agent.md` | Agent definition for VS Code Copilot Chat |

---

## Critical Analysis

### Value Assessment

**High value**: This fills a real gap in AI-assisted workflows. Currently, review artifacts are write-once; this makes them interactive and actionable.

**Differentiation**: Unlike generic commenting tools (which don't understand structure), this produces machine-parseable annotations that downstream AI can consume.

### Build vs. Modify Tradeoffs

**Build new**: No existing tool provides this specific combination of:
- Inline markdown annotations
- Structured status fields
- AI-assisted iteration mode
- GitHub-style callout format

### Risks

| Risk | Mitigation |
|------|------------|
| Preview pane selection may not be supported by VS Code API | Fall back to raw markdown only; explore custom webview preview |
| Annotation blocks clutter the document | Keep format minimal; future: add collapse/expand |
| Format doesn't survive file regeneration | Accepted limitation — annotations are point-in-time |

---

## Codebase Fit

**New project** — `markdown-commenter` is a standalone repository.

**Reuse opportunities**:
- VS Code extension scaffold (yeoman generator)
- GitHub-style callout parsing (existing markdown parsers)
- Copilot CLI skill patterns (from PAW skills)

---

## Open Questions for Downstream Stages

1. **Preview pane**: What VS Code APIs are available for selection in markdown preview? May need `markdown.previewStyles` or custom webview.

2. **Agent definition format**: What's the exact format for VS Code Copilot Chat agents? Need to research current capabilities.

3. **Callout rendering**: Does `> [!COMMENT]` render specially on GitHub? May want a type that renders distinctly (e.g., `> [!NOTE]` has special styling).

4. **Extension publishing**: What's the plan for distribution? VS Code Marketplace? Private?

---

## Session Notes

### Key Decisions

- **Pivoted from PAW skill** to standalone VS Code extension + Copilot CLI skill (cleaner separation, broader applicability)
- **Atomic placement** chosen over section-based grouping (simpler, more predictable)
- **Minimal `Re` field** — only for VS Code partial highlights, omitted for Copilot-generated annotations
- **No export features** initially — keep scope tight for v1
- **Overlapping annotations allowed** — user manages complexity

### Rejected Alternatives

- Sidecar annotation files (`.annotations.json`) — rejected in favor of inline for single-source-of-truth
- HTML comments (`<!-- -->`) — rejected because invisible in rendered markdown
- Position-based references (line:col) — rejected as fragile; truncated quotes more durable
- Complex grouping logic (nested headers, section collection) — rejected for simplicity

### Surprising Discoveries

- The annotation format serves dual audiences (humans AND LLMs) — this influenced the minimal `Re` field decision
- Preview pane selection is a nice-to-have that may require significant workaround (custom webview)
