# Markdown Commenter - Technical Documentation

## Architecture Overview

Markdown Commenter provides AI-assisted document annotation through two distribution channels:

### Dual Distribution Model

| Distribution | Agent Location | Skill Delivery |
|--------------|----------------|----------------|
| **VS Code Extension** | `~/.config/Code/User/prompts/` (Linux) | Language Model Tool (`vscode.lm.registerTool`) |
| **CLI Package** | `~/.copilot/agents/` | `~/.copilot/skills/` (file copy) |

The same skill and agent content is used for both, with conditional blocks (`{{#vscode}}`, `{{#cli}}`) for environment-specific behavior.

## Annotation Format Specification

Annotations use GitHub-style callout blocks with the `[!COMMENT]` type:

```markdown
> [!COMMENT]
> **ID**: <8-char-alphanumeric>
> **Status**: Accept|Reject|Skip|Question
> **Re**: "<optional quoted reference>" 
>
> Optional comment text (can be multi-line)
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `ID` | Yes | 8-character alphanumeric identifier (lowercase + digits) |
| `Status` | Yes | One of: `Accept`, `Reject`, `Skip`, `Question` |
| `Re` | No | Quoted reference to the annotated item (truncated if long) |
| Comment | No | Free-text explanation (after blank `>` line) |

### Valid Status Values

- **Accept**: User agrees with the item
- **Reject**: User disagrees or identifies an issue
- **Skip**: Item not relevant or deferred
- **Question**: User needs clarification before deciding

## TypeScript API

### Types (`src/annotations/types.ts`)

```typescript
type Verdict = 'Accept' | 'Reject' | 'Skip' | 'Question';

interface Annotation {
  id: string;
  status: Verdict;
  re?: string;
  comment?: string;
}

interface AnnotatedBlock {
  annotation: Annotation;
  startLine: number;
  endLine: number;
}
```

### Parser (`src/annotations/parser.ts`)

```typescript
// Parse a single annotation block
function parseAnnotation(blockText: string): Annotation | null;

// Find all annotations in file content
function findAnnotations(content: string): AnnotatedBlock[];
```

### Writer (`src/annotations/writer.ts`)

```typescript
// Generate random 8-character ID
function generateId(): string;

// Format annotation as callout block
function formatAnnotation(annotation: Annotation): string;

// Insert annotation after specified line
function insertAnnotation(content: string, lineNumber: number, annotation: Annotation): string;
```

## Skill/Agent Infrastructure

### Platform Detection (`src/agents/platformDetection.ts`)

Resolves the VS Code prompts directory per platform:
- **Linux**: `~/.config/Code/User/prompts/`
- **macOS**: `~/Library/Application Support/Code/User/prompts/`
- **Windows**: `%APPDATA%/Code/User/prompts/`

### Agent Templates (`src/agents/agentTemplates.ts`)

Loads `.agent.md` files from the extension's `agents/` directory for installation.

### Agent Installer (`src/agents/installer.ts`)

- Checks if installation is needed (version comparison)
- Processes conditional blocks for VS Code environment
- Writes agent files to prompts directory
- Tracks installation state in `globalState`
- Development versions (`-dev`) always reinstall

### Skill Loader (`src/skills/skillLoader.ts`)

- Parses YAML frontmatter from `SKILL.md` files
- Provides skill catalog (list of available skills)
- Loads full skill content by name

### Language Model Tool (`src/tools/skillTool.ts`)

Registers `markdown-commenter-skill` tool with VS Code's Language Model API:
- Invokable by agents via `<use_tool name="markdown-commenter-skill" />`
- Returns full skill content for annotation workflow

## Configuration Options

### VS Code Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `markdown-commenter.promptsDirectory` | string | `""` | Custom agent installation directory |

### Extension Manifest

Key `package.json` contributions:
- `activationEvents`: `onStartupFinished` (agent installed on VS Code startup)
- `languageModelTools`: Registers skill retrieval tool

## CLI Package

### Installation

```bash
npx @erdem-tuna/markdown-commenter install copilot
```

Installs to:
- `~/.copilot/agents/Annotate.agent.md`
- `~/.copilot/skills/annotate/SKILL.md`

### Commands

| Command | Description |
|---------|-------------|
| `install copilot` | Install to Copilot CLI |
| `uninstall` | Remove installed files |
| `list` | Show installation info |
| `help` | Display help |

### Build Process

`cli/scripts/build.js` processes agent files for CLI distribution:
1. Reads `agents/*.agent.md` from root
2. Removes `{{#vscode}}...{{/vscode}}` blocks
3. Keeps `{{#cli}}...{{/cli}}` content (removes tags)
4. Writes to `cli/dist/agents/`
5. Copies `skills/` to `cli/dist/skills/`

### Manifest Tracking

Installation state stored in `~/.paw/markdown-commenter/manifest.json`:
```json
{
  "version": "0.0.1-dev",
  "target": "copilot",
  "installedAt": "2024-01-01T00:00:00.000Z",
  "files": {
    "agents": "/home/user/.copilot/agents",
    "skills": "/home/user/.copilot/skills"
  }
}
```

## Development Setup

### Prerequisites

- Node.js 18+
- VS Code 1.85+
- npm

### Build

```bash
npm install
npm run compile
```

### Test

```bash
npm test
```

### Package

```bash
npm run package
```

### Debug

1. Open in VS Code
2. Press F5 to launch Extension Development Host
3. Check "Markdown Commenter" output channel

## File Structure

```
markdown-commenter/
├── agents/
│   └── Annotate.agent.md       # Agent with conditional blocks
├── skills/
│   └── annotate/
│       └── SKILL.md            # Annotation workflow skill
├── src/
│   ├── extension.ts            # Extension entry point
│   ├── annotations/            # Annotation utilities
│   │   ├── types.ts
│   │   ├── parser.ts
│   │   ├── writer.ts
│   │   └── index.ts
│   ├── agents/                 # Agent infrastructure
│   │   ├── platformDetection.ts
│   │   ├── agentTemplates.ts
│   │   ├── agentTemplateRenderer.ts
│   │   └── installer.ts
│   ├── skills/
│   │   └── skillLoader.ts
│   └── tools/
│       └── skillTool.ts
├── cli/                        # CLI installer package
│   ├── bin/cli.js
│   ├── lib/installer.js
│   └── scripts/build.js
└── package.json
```
