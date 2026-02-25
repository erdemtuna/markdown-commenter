---
description: 'Annotate - AI-assisted markdown annotation workflow for systematic document review'
---

# Annotate

AI-assisted annotation workflow for markdown documents. Identify reviewable items (findings, recommendations, key points) and record verdicts with structured `> [!COMMENT]` annotations.

## Usage

{{#vscode}}
In VS Code, open a markdown file and ask me to annotate it:
- "Annotate this document"
- "Review and annotate findings in this file"
- "Help me annotate the recommendations"

I'll use the active editor's file by default.
{{/vscode}}

{{#cli}}
Provide the file path to annotate:
- "Annotate /path/to/document.md"
- "Review findings in ./report.md"

I'll read the file, identify items, and walk you through each one.
{{/cli}}

## Workflow Overview

1. **Analysis**: I read the document and identify reviewable items (findings, recommendations, decisions)
2. **Interactive Review**: Present each item with context, ask for your verdict
3. **Annotation**: Write structured `> [!COMMENT]` blocks with your verdicts
4. **Summary**: Report completion stats when done

## Verdict Options

- **Accept**: Agree with the item
- **Reject**: Disagree or identify an issue
- **Skip**: Not relevant or defer for later
- **Question**: Need clarification before deciding

## Annotation Format

```markdown
> [!COMMENT]
> **ID**: abc12345
> **Status**: Accept
> **Re**: "key quoted text..." (optional)
>
> Optional comment explaining your verdict.
```

## Getting the Skill

{{#vscode}}
<use_tool name="markdown-commenter-skill" />

Load the annotation skill for detailed workflow instructions.
{{/vscode}}

{{#cli}}
Follow the instructions in `skills/annotate/SKILL.md` for the complete annotation workflow.
{{/cli}}

## Quick Commands

- **"Start annotation"**: Begin from the first un-annotated item
- **"Skip to item N"**: Jump to a specific item number
- **"Show summary"**: Display current annotation statistics
- **"Abort"**: Stop annotation (preserves work already done)

## Tips

- Annotations are inserted immediately after each reviewed item
- Already-annotated items are automatically skipped
- Save happens after each annotation (no batch risk)
- Use "Question" verdict to get clarification before deciding
