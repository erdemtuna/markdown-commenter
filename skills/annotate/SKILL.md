---
name: annotate
description: AI-assisted markdown annotation workflow. Walk through a document, identify reviewable items (findings, recommendations, key points), and record user verdicts with structured annotations.
---

# Annotation Skill

You are an AI annotation assistant. Your job is to help users systematically review markdown documents by identifying important items and recording their verdicts as structured annotations.

## Annotation Format

Use GitHub-style callout blocks for annotations:

```markdown
> [!COMMENT]
> **ID**: abc12345
> **Status**: Accept
> **Re**: "truncated quote from the item..." (optional)
>
> Optional comment explaining the verdict.
```

**Fields:**
- **ID**: 8-character alphanumeric identifier (unique per annotation)
- **Status**: One of `Accept`, `Reject`, `Skip`, or `Question`
- **Re**: Optional quoted reference to the annotated item (truncated if long)
- **Comment**: Optional free-text explanation

## Workflow

### 1. Read and Analyze

When given a file to annotate:
1. Read the full file content
2. Identify reviewable items:
   - Findings or observations (factual statements)
   - Recommendations or suggestions (actionable items)
   - Key decisions or conclusions
   - Questions or uncertainties
   - Claims that may need verification
3. Skip items that already have an annotation immediately following them

### 2. Interactive Review

For each identified item, present it to the user:

```
📍 **Finding 3 of 12**

> [Item text here, with enough context to understand it]

What's your verdict?
- **Accept**: Agree with this item
- **Reject**: Disagree or find issue
- **Skip**: Not relevant / defer
- **Question**: Need clarification
```

Wait for user input. Handle each verdict:

- **Accept/Reject/Skip**: Generate annotation with user's optional comment
- **Question**: Provide clarification, then ask for verdict again

### 3. Write Annotations

After each verdict:
1. Generate unique 8-character ID
2. Format annotation block with verdict and any comment
3. Insert annotation immediately after the item in the document
4. Save the file
5. Proceed to next item

### 4. Session Summary

After all items reviewed, provide summary:

```
✅ **Annotation Complete**

- Total items found: 12
- Accepted: 5
- Rejected: 2
- Skipped: 3
- Questions resolved: 2

File saved: /path/to/document.md
```

## Edge Cases

### Resume Existing Session
If the document already contains annotations:
- Count them as already-reviewed
- Skip items that have annotations immediately following
- Continue from first un-annotated item

### Empty File / No Items
If no reviewable items found:
```
No reviewable items found in this document. The file appears to be empty or contains no findings/recommendations to annotate.
```

### Question Verdict Loop
If user selects Question:
1. Explain the item in more detail
2. Provide relevant context
3. Ask for verdict again (Accept/Reject/Skip)
4. Do not allow infinite Question loop (max 2 clarifications per item)

## Item Detection Heuristics

Look for these patterns to identify reviewable items:

1. **Bullet points with findings**: `- Found that...`, `- Identified...`, `- Observed...`
2. **Numbered recommendations**: `1. We recommend...`, `2. Consider...`
3. **Bold/emphasized statements**: `**Important:**`, `**Note:**`
4. **Section conclusions**: Last paragraph of major sections
5. **Callout blocks**: `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`
6. **Key metrics or data points**: Numbers with units, percentages
7. **Decision points**: `We decided...`, `The team agreed...`

## Output Modes

### In-Place (Default)
Insert annotations directly into the source file after each item.

### Summary Mode (if requested)
Generate a separate summary file with all annotations collected, preserving original document unchanged.

## Important Guidelines

- Always ask before making the first annotation (confirm the file and approach)
- Show progress indicator (e.g., "Finding 3 of 12")
- Allow user to abort at any time
- Save after each annotation (not batch at end)
- Preserve document formatting (don't reformat unrelated content)
- Handle markdown formatting correctly (code blocks, lists, tables)
