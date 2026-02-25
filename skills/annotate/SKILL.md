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

### 1. Setup

Before starting annotation, ask the user:

```
📄 **Output Mode**

Where should I write annotations?

**1** Original file (modify in-place)
**2** Separate file (`.annotate/` folder, preserves original)

Enter 1 or 2:
```

If user selects **2** (separate file):
- Create `.annotate/` folder in the same directory as the source file
- Copy the original file to `.annotate/<filename>`
- All annotations go into the copy, original stays untouched
- Example: `report.md` → `.annotate/report.md`

### 2. Read and Analyze

When given a file to annotate:
1. Read the full file content
2. Identify reviewable items:
   - Findings or observations (factual statements)
   - Recommendations or suggestions (actionable items)
   - Key decisions or conclusions
   - Questions or uncertainties
   - Claims that may need verification
3. Skip items that already have an annotation immediately following them

### 3. Interactive Review

For each identified item, present it to the user:

```
📍 **Finding 3 of 12**

> [Item text here, with enough context to understand it]

**1** Accept | **2** Reject | **3** Skip | **4** Question

Enter: number, or number - your comment/question
```

**Input format:**
- `1` → Accept (no comment)
- `1 - looks good` → Accept with comment
- `2 - contradicts section 3.2` → Reject with comment
- `3` → Skip
- `4 - what does this mean in context of X?` → Question with your question

**Handling each input:**
- **1, 2, or 3** (with or without comment): Generate annotation, proceed to next item
- **4 - question**: Answer the user's question, then re-present the **same finding** with verdict options again

### 4. Write Annotations

After each verdict (except Question):
1. Generate unique 8-character ID
2. Format annotation block with verdict and any comment
3. Insert annotation immediately after the item in the target file
4. Save the file
5. Proceed to next item

### 5. Session Summary

After all items reviewed, provide summary:

```
✅ **Annotation Complete**

- Total items found: 12
- Accepted: 5
- Rejected: 2
- Skipped: 3
- Questions answered: 2

Output: /path/to/.annotate/document.md (or original if in-place)
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

### Question Flow
When user enters `4 - <question>`:
1. Answer their specific question about the finding
2. Re-present the **same finding** with the verdict prompt
3. User then enters 1, 2, or 3 to give final verdict
4. Maximum 2 questions per finding (prevent infinite loop)

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

### In-Place (Option 1)
Insert annotations directly into the source file after each item.

### Separate File (Option 2)
- Create `.annotate/` folder in source file's directory
- Copy original to `.annotate/<filename>`
- Write all annotations to the copy
- Original file remains unchanged
- Useful for preserving original or when annotations shouldn't be committed

## Important Guidelines

- Ask output mode (in-place vs `.annotate/` folder) before starting
- Show progress indicator (e.g., "Finding 3 of 12")
- Use numeric input format: `1`, `2`, `3`, `4` with optional `- comment`
- Allow user to abort at any time (type "abort" or "stop")
- Save after each annotation (not batch at end)
- Preserve document formatting (don't reformat unrelated content)
- Handle markdown formatting correctly (code blocks, lists, tables)
