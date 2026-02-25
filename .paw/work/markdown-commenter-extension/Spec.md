# Feature Specification: Markdown Commenter Extension

**Branch**: feature/markdown-commenter-extension  |  **Created**: 2026-02-25  |  **Status**: Draft
**Input Brief**: VS Code extension with Copilot CLI skill and Chat agent for AI-assisted markdown annotation

## Overview

Developers working with AI-generated review artifacts—code reviews, spec reviews, plan reviews, and similar structured markdown documents—currently have no standardized way to record their decisions inline. When an AI produces a review with multiple findings and recommendations, users either manually edit files in ad-hoc ways or lose their feedback entirely. The review-to-action feedback loop is broken.

This extension introduces AI-assisted annotation for markdown files. Users invoke the annotation workflow through Copilot CLI or VS Code Copilot Chat, and the AI reads the document, identifies reviewable items (findings, recommendations, issues), and walks the user through each one interactively. For each item, the user provides a verdict—Accept, Reject, Skip, or Question—and an optional comment. The AI then writes structured inline annotations using GitHub-style callout blocks that are both human-readable and machine-parseable.

The extension is distributed via the VS Code Marketplace, making it easy for anyone to install and immediately benefit from structured annotation workflows. The underlying annotation format is designed to be consumed by downstream processes—whether human reviewers scanning a document or AI agents that need to understand which items were accepted or rejected.

This work focuses on the AI-assisted annotation path. Manual annotation features (selecting text and adding comments via UI) are planned for a future release.

## Objectives

- Enable developers to systematically review and respond to findings in any markdown document through conversational AI interaction
- Produce machine-parseable annotations that downstream AI agents can consume for automated workflows
- Distribute as a VS Code Marketplace extension for easy installation and updates
- Provide both Copilot CLI (terminal) and VS Code Copilot Chat (IDE) as interaction surfaces
- Establish a foundation of TypeScript utilities for annotation parsing/writing that future manual annotation features can build upon

## User Scenarios & Testing

### User Story P1 – Annotate Review Findings via Copilot CLI

**Narrative**: A developer receives an AI-generated code review saved as `review.md` with 8 findings. They invoke the Copilot CLI skill by asking to "annotate review.md". The agent reads the file, identifies the findings, and presents each one interactively. The developer accepts 5 findings, rejects 2 with explanations ("not applicable to our codebase"), and marks 1 as needing clarification. The annotated file now contains structured `> [!COMMENT]` blocks that document their decisions.

**Independent Test**: User invokes the annotate skill on a markdown file with findings and successfully records a verdict for at least one item.

**Acceptance Scenarios**:
1. Given a markdown file with 3 findings, When user asks to "annotate review.md", Then agent identifies and presents the first finding with verdict options (Accept/Reject/Skip/Question).
2. Given the agent is presenting a finding, When user selects "Accept", Then an annotation block with Status: Accept is written adjacent to that finding in the file.
3. Given the agent is presenting a finding, When user selects "Reject" and provides comment "Not applicable to our codebase", Then the annotation includes both the status and the comment text.
4. Given all findings have been annotated, When the session completes, Then user sees a summary of verdicts (e.g., "5 Accept, 2 Reject, 1 Question").

### User Story P2 – Annotate via VS Code Copilot Chat

**Narrative**: A developer has a spec review open in VS Code. They open Copilot Chat (with the markdown-commenter agent active) and ask to annotate the current file. The same interactive flow occurs within the chat panel, with the agent presenting findings and recording verdicts to the file.

**Independent Test**: User invokes annotation via Copilot Chat in VS Code and successfully records a verdict.

**Acceptance Scenarios**:
1. Given a markdown file path is provided in chat, When user asks to annotate it, Then agent begins the interactive annotation flow.
2. Given the agent presents a finding in chat, When user responds with "Accept", Then the annotation is written to the file.
3. Given the markdown-commenter agent is selected in VS Code, When user asks about annotation workflow, Then agent responds with knowledge of the annotation system.

### User Story P3 – Control Output Destination

**Narrative**: A developer wants to preserve the original review file unchanged. When invoking the annotation workflow, they specify output to a new file. The original remains pristine while the annotated version is written separately.

**Independent Test**: User specifies output file and annotations are written there instead of modifying the source.

**Acceptance Scenarios**:
1. Given user invokes annotation, When they specify "output to review.annotated.md", Then annotations are written to that file instead of the source.
2. Given user invokes annotation without specifying output, When the agent asks, Then user can choose in-place edit or specify a new file.
3. Given output is a new file, When annotation completes, Then the original file is unmodified.

### User Story P4 – Ask Questions About Findings

**Narrative**: A developer encounters a finding they don't understand. They select "Question" as their verdict and the agent provides additional explanation or context about the finding before allowing them to revise their verdict or move on.

**Independent Test**: User selects Question verdict and receives agent clarification.

**Acceptance Scenarios**:
1. Given a finding is presented, When user selects "Question", Then agent provides expanded explanation of the finding.
2. Given agent has provided explanation, When user is satisfied, Then they can provide a final verdict (Accept/Reject/Skip) or keep Question.
3. Given user wants to move on without resolving, When they say "skip for now", Then a Question annotation is recorded and agent proceeds to next finding.

### User Story P5 – Install Extension from Marketplace

**Narrative**: A developer discovers the markdown-commenter extension in the VS Code Marketplace. They click Install, and the extension activates. The Copilot CLI skill and Chat agent become available for use.

**Independent Test**: User installs extension from marketplace and can invoke the annotation workflow.

**Acceptance Scenarios**:
1. Given user searches "markdown commenter" in VS Code Extensions, When results appear, Then the extension is findable.
2. Given user installs the extension, When installation completes, Then the Copilot Chat agent is available in the agent picker.
3. Given the extension is installed, When user invokes the annotation skill in Copilot CLI, Then the skill is recognized and executes.

### Edge Cases

- **Empty file**: Agent reports no reviewable items found and exits gracefully with suggestion to check file content.
- **File with no findings**: Agent scans file, determines nothing matches finding heuristics, reports "No reviewable items detected" with suggestion for manual review.
- **User interrupts mid-session**: Annotations written so far persist in the file; user can re-invoke to continue from first unannotated finding.
- **Malformed markdown**: Agent handles gracefully, skipping unparseable sections with a warning.
- **File already has annotations**: Agent identifies unannotated findings only; previously annotated items are skipped.
- **Large file with many findings**: Agent shows progress ("Finding 3 of 12") and allows early exit with partial annotations preserved.

## Requirements

### Functional Requirements

- FR-001: Extension activates in VS Code and registers its components (Stories: P5)
- FR-002: Copilot CLI skill file defines the annotation workflow and is discoverable by Copilot CLI (Stories: P1, P5)
- FR-003: VS Code Copilot Chat agent definition enables annotation workflow in IDE chat panel (Stories: P2, P5)
- FR-004: Agent parses markdown file and identifies reviewable items using heuristics (headers with keywords like "Finding", "Issue", "Recommendation"; bulleted lists with severity markers; numbered items) (Stories: P1, P2)
- FR-005: Agent presents each reviewable item to user with context (item content, position in document) and verdict options (Accept, Reject, Skip, Question) (Stories: P1, P2, P4)
- FR-006: Agent records user verdict by writing annotation block in GitHub callout format (`> [!COMMENT]`) adjacent to the item (Stories: P1, P2)
- FR-007: Annotation block includes: unique short ID (8 chars), Status field, optional user comment (Stories: P1, P2)
- FR-008: Agent supports "Question" verdict flow where it provides clarification before allowing verdict revision or continuation (Stories: P4)
- FR-009: Agent provides session summary upon completion showing verdict counts (Stories: P1)
- FR-010: User can specify output destination: in-place edit or separate file (Stories: P3)
- FR-011: Agent skips items that already have adjacent annotation blocks when resuming (Stories: P1, P2)
- FR-012: TypeScript utilities provide annotation parsing and writing functions for programmatic use (Stories: P1, P2)

### Key Entities

- **Reviewable Item**: A section of markdown identified as a finding, issue, or recommendation based on structural heuristics
- **Annotation Block**: A GitHub-style callout (`> [!COMMENT]`) containing ID, Status, and optional comment
- **Verdict**: One of Accept, Reject, Skip, or Question representing user's response to a reviewable item

### Cross-Cutting / Non-Functional

- Annotation format must be valid markdown that renders appropriately on GitHub
- Agent must not modify file content outside of adding annotation blocks
- Skill and agent definitions must be self-contained markdown files following Copilot conventions
- Extension must be publishable to VS Code Marketplace

## Success Criteria

- SC-001: Extension installs from VS Code Marketplace without errors (FR-001)
- SC-002: User can invoke annotation on a markdown file via Copilot CLI and receive interactive prompts for detected findings (FR-002, FR-004, FR-005)
- SC-003: User can invoke annotation via VS Code Copilot Chat agent and receive interactive prompts (FR-003, FR-004, FR-005)
- SC-004: All four verdict types (Accept, Reject, Skip, Question) produce correctly formatted annotation blocks (FR-006, FR-007, FR-008)
- SC-005: Annotation blocks written by the agent are parseable by the TypeScript utilities (FR-006, FR-007, FR-012)
- SC-006: Session completion displays accurate summary of verdicts recorded (FR-009)
- SC-007: User can preserve original file by specifying alternate output destination (FR-010)
- SC-008: Re-invoking annotation on a partially-annotated file skips already-annotated items (FR-011)

## Assumptions

- **Copilot CLI skill discovery**: Skills in the extension's `skills/` directory will be discoverable when the extension is installed, either via VS Code settings or standard Copilot CLI skill paths.
- **VS Code Chat agent discovery**: Agent definitions in the extension's `agents/` directory will be discoverable by VS Code Copilot Chat when the extension is installed.
- **Finding heuristics sufficient**: Structural heuristics (headers, bullets, keywords) will identify most reviewable items in typical review documents. Edge cases handled gracefully with "no findings" message.
- **File write permissions**: Agent has write access to target file or output destination.
- **Single file scope**: Each invocation operates on one file. Multi-file annotation is out of scope.

## Scope

**In Scope**:
- VS Code extension package structure (package.json, extension.ts activation)
- Copilot CLI skill file (`skills/annotate/SKILL.md`)
- VS Code Copilot Chat agent definition (`agents/annotate.agent.md`)
- Annotation format as defined in WorkShaping.md
- Finding detection heuristics (documented in skill)
- Interactive verdict flow with all four verdict types
- Output destination control (in-place vs. new file)
- Session summary generation
- Resume capability (skip already-annotated items)
- TypeScript utilities for annotation parsing/writing (`src/annotations/`)
- VS Code Marketplace publishing configuration

**Out of Scope**:
- Manual annotation UI (selection-based annotation, CodeLens, sidebar panel)
- Preview pane integration
- Export/reporting features
- Multi-file batch annotation
- Custom verdict types beyond the four defined
- Integration with specific downstream workflows (consuming annotations)
- Annotation editing/deletion via UI (users edit markdown directly)

## Dependencies

- VS Code ^1.85.0 (for extension API compatibility)
- Copilot CLI environment for skill execution
- VS Code with Copilot Chat for agent execution
- npm/Node.js for extension building and publishing
- vsce tool for VSIX packaging

## Risks & Mitigations

- **Finding detection misses items**: Users may have review documents with non-standard structure. Mitigation: Document supported patterns clearly; agent reports when no findings detected; future manual annotation will handle edge cases.
- **Annotation format conflicts with existing content**: File may already contain `> [!COMMENT]` blocks for other purposes. Mitigation: Agent checks for `**Status**:` field to distinguish annotation blocks from other callouts.
- **Skill/agent discovery varies by environment**: Different Copilot CLI/VS Code configurations may discover skills differently. Mitigation: Document installation and configuration steps; test across common setups.
- **VS Code Chat agent API changes**: Copilot Chat extensibility is evolving. Mitigation: Keep agent definition minimal and follow current conventions; document version compatibility.
- **Large files slow interaction**: Files with many findings create long sessions. Mitigation: Agent shows progress ("Finding 3 of 12"); user can exit early with partial annotations preserved.

## References

- WorkShaping: ./WorkShaping.md
- Annotation Format: ./WorkShaping.md#annotation-format-specification
- Reference Project: /home/erdemtuna/workspace/personal/phased-agent-workflow
