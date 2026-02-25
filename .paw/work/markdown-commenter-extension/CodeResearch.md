---
date: 2026-02-25T11:20:00Z
git_commit: ea45020
branch: feature/markdown-commenter-extension
repository: markdown-commenter
topic: "VS Code Extension Structure for Copilot Skills and Agents"
tags: [research, vscode-extension, copilot-skill, copilot-agent, typescript]
status: complete
last_updated: 2026-02-25
---

# Research: VS Code Extension Structure for Copilot Skills and Agents

## Research Question

How should a VS Code extension be structured to distribute Copilot CLI skills and Chat agents? What patterns does the phased-agent-workflow reference project use that can be adapted for markdown-commenter?

## Summary

The phased-agent-workflow project provides a complete reference implementation for a VS Code extension that distributes Copilot skills and agents. Key findings:

1. **Extension structure**: Standard VS Code extension with `package.json`, `extension.ts`, TypeScript source in `src/`
2. **Skills**: Stored in `skills/<skill-name>/SKILL.md` at extension root, loaded via TypeScript utilities
3. **Agents**: Stored in `agents/<name>.agent.md` at extension root, installed to user's prompts directory on activation
4. **Distribution**: Skills are served via Language Model Tools; agents are copied to platform-specific prompts directory
5. **TypeScript utilities**: `src/skills/skillLoader.ts` parses SKILL.md frontmatter; `src/agents/installer.ts` handles agent installation

The markdown-commenter extension can follow this pattern with minimal modifications.

## Documentation System

- **Framework**: mkdocs (based on `mkdocs.yml` presence in reference project)
- **Docs Directory**: `docs/` (in reference project)
- **Navigation Config**: `mkdocs.yml`
- **Style Conventions**: N/A for new project (will establish own)
- **Build Command**: N/A for new project
- **Standard Files**: README.md at root (to be created)

## Verification Commands

Based on reference project `package.json:122-137`:

- **Test Command**: `npm test` (runs `node ./out/test/runTest.js`)
- **Lint Command**: `npm run lint` (runs `eslint src --ext ts`)
- **Build Command**: `npm run compile` (runs `tsc -p ./`)
- **Type Check**: Implicit in `npm run compile` (TypeScript compilation)

## Detailed Findings

### Extension Entry Point

The extension activates on `onStartupFinished` event to ensure agents are installed before users interact with Copilot.

**Reference**: `phased-agent-workflow/package.json:24-26`
```json
"activationEvents": [
  "onStartupFinished"
]
```

**Reference**: `phased-agent-workflow/src/extension.ts:37-74`
- Creates output channel for logging
- Installs/updates agents if needed
- Registers Language Model Tools for skills
- Registers commands

### Skills Directory Structure

Skills are stored in `skills/<skill-name>/SKILL.md` format:

**Reference**: `phased-agent-workflow/skills/` — contains 40+ skill directories
**Reference**: `phased-agent-workflow/skills/paw-work-shaping/SKILL.md:1-6` — YAML frontmatter with `name` and `description`

**SKILL.md format**:
```yaml
---
name: skill-name
description: Skill description for discovery and activation.
---

# Skill Title

[Markdown body with instructions]
```

### Skill Loading Mechanism

Skills are NOT automatically discovered by Copilot CLI. Instead, the extension provides Language Model Tools that agents can call to retrieve skill content.

**Reference**: `phased-agent-workflow/src/skills/skillLoader.ts:187-219` — `loadSkillCatalog()` function
- Scans `skills/` directory for subdirectories
- Reads SKILL.md from each
- Parses frontmatter for `name` and `description`
- Returns catalog entries

**Reference**: `phased-agent-workflow/src/skills/skillLoader.ts:228-243` — `loadSkillContent()` function
- Takes skill name, returns full SKILL.md content
- Used by agents to load skills on demand

**Reference**: `phased-agent-workflow/src/tools/skillTool.ts:14-60` — Language Model Tool registration
- Registers `paw_get_skill` tool via `vscode.lm.registerTool()`
- Agents call this tool to retrieve skill content

### Agent Installation Mechanism

Agents are installed to the user's platform-specific prompts directory on extension activation.

**Reference**: `phased-agent-workflow/src/agents/installer.ts:102-153` — `needsInstallation()` function
- Checks if installation needed (fresh install, version change, missing files)
- Compares extension version with saved state
- Development versions (`-dev` suffix) always reinstall

**Reference**: `phased-agent-workflow/src/agents/installer.ts:77-87` — `getPromptsDirectoryPath()` function
- Detects platform (macOS, Windows, Linux)
- Returns appropriate path (e.g., `~/.cursor/prompts/`, `~/.copilot/prompts/`)
- Supports custom path via `paw.promptDirectory` setting

**Reference**: `phased-agent-workflow/src/agents/agentTemplates.ts:99-134` — `loadAgentTemplates()` function
- Reads `.agent.md` files from extension's `agents/` directory
- Extracts description from YAML frontmatter
- Processes template substitutions (components, variables)

### Agents Directory Structure

Agents are stored in `agents/<name>.agent.md` format:

**Reference**: `phased-agent-workflow/agents/` — contains `PAW.agent.md`, `PAW Review.agent.md`, `PAW Discovery.agent.md`

**.agent.md format**:
```yaml
---
description: 'Agent Name - Brief description'
---

# Agent Title

[Markdown body with persona and workflow instructions]
```

### Package.json Configuration

Key VS Code extension fields:

**Reference**: `phased-agent-workflow/package.json:1-55`
```json
{
  "name": "paw-workflow",
  "displayName": "PAW Workflow",
  "description": "...",
  "version": "0.0.2-dev",
  "publisher": "paw-workflow",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "configuration": {...},
    "commands": [...],
    "languageModelTools": [...]
  }
}
```

**Language Model Tools** (`package.json:56-119`):
- `paw_new_session`: Handoff tool for agent transitions
- `paw_get_skills`: Returns skill catalog
- `paw_get_skill`: Returns specific skill content

### TypeScript Project Configuration

**Reference**: `phased-agent-workflow/tsconfig.json:1-16`
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "rootDir": "src",
    "strict": true
  }
}
```

### Build and Package Scripts

**Reference**: `phased-agent-workflow/package.json:122-137`
- `compile`: `tsc -p ./`
- `watch`: `tsc -watch -p ./`
- `package`: `vsce package`
- `build-vsix`: Custom script for VSIX generation

### .vscodeignore Configuration

**Reference**: `phased-agent-workflow/.vscodeignore:1-12`
- Excludes `.vscode/**`, `src/**` (TypeScript sources), `node_modules/**`
- Retains compiled `out/` directory
- Retains `skills/` and `agents/` directories (implicitly, not excluded)

## Architecture for markdown-commenter

Based on reference project patterns, the markdown-commenter extension should have:

```
markdown-commenter/
├── package.json           # VS Code extension manifest
├── tsconfig.json          # TypeScript configuration
├── .vscodeignore          # VSIX packaging exclusions
├── src/
│   ├── extension.ts       # Extension entry point
│   ├── agents/
│   │   ├── installer.ts   # Agent installation to prompts dir
│   │   └── ...
│   ├── skills/
│   │   └── skillLoader.ts # Skill catalog and content loading
│   ├── tools/
│   │   └── skillTool.ts   # Language Model Tool registration
│   └── annotations/       # TypeScript utilities for annotation format
│       ├── parser.ts      # Parse > [!COMMENT] blocks
│       ├── writer.ts      # Write annotation blocks
│       └── types.ts       # Annotation type definitions
├── skills/
│   └── annotate/
│       └── SKILL.md       # Copilot CLI skill for annotation
├── agents/
│   └── annotate.agent.md  # VS Code Chat agent for annotation
└── README.md
```

### Key Adaptations from Reference Project

1. **Simpler agent installer**: Only one agent file to install (vs. multiple in PAW)
2. **Single skill**: Only the annotate skill (vs. 40+ in PAW)
3. **New annotations/ module**: TypeScript utilities for parsing/writing annotation blocks (not in reference)
4. **No template processing**: Simple static skill/agent files (no component substitution needed)

## Code References

- `phased-agent-workflow/package.json:1-156` — Full extension manifest
- `phased-agent-workflow/src/extension.ts:37-74` — Activation function
- `phased-agent-workflow/src/agents/installer.ts:102-153` — Installation check logic
- `phased-agent-workflow/src/skills/skillLoader.ts:187-243` — Skill loading utilities
- `phased-agent-workflow/src/tools/skillTool.ts:14-60` — Language Model Tool registration
- `phased-agent-workflow/tsconfig.json:1-16` — TypeScript configuration
- `phased-agent-workflow/.vscodeignore:1-12` — VSIX packaging exclusions
- `phased-agent-workflow/cli/README.md:1-141` — CLI package documentation
- `phased-agent-workflow/cli/lib/installer.ts` — CLI installation logic
- `phased-agent-workflow/src/agents/agentTemplateRenderer.ts:22-49` — Conditional block processing

## Resolved Questions

1. **Skill discovery mechanism**: PAW uses a **dual distribution model**:
   - **VS Code**: Skills served via Language Model Tools (`vscode.lm.registerTool`)
   - **CLI**: Separate npm package (`@paw-workflow/cli`) installs skills to `~/.copilot/skills/`
   - The agent file uses conditional blocks (`{{#vscode}}`, `{{#cli}}`) to reference skills differently in each environment

2. **Agent installation path**: Full multi-platform support (macOS, Windows, Linux) with configurable custom path. We will follow this pattern.

3. **Annotation utilities scope**: Keep internal to extension. Future work could expose as separate npm package if needed.

## Open Questions

None — all questions resolved through deeper investigation of reference project.
