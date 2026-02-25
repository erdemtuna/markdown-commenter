# Markdown Commenter Extension Implementation Plan

## Overview

Build a VS Code extension distributed via Marketplace AND a CLI installer package that provides AI-assisted markdown annotation through a Copilot CLI skill and VS Code Copilot Chat agent. Users invoke the annotation workflow, the AI identifies reviewable items (findings, recommendations), walks users through each interactively, and writes structured `> [!COMMENT]` annotations with their verdicts.

**Dual distribution model** (following PAW pattern):
1. **VS Code Extension**: For IDE users — installs agent to prompts dir, serves skill via Language Model Tool
2. **CLI Package**: For terminal users — `npx @erdem-tuna/markdown-commenter install copilot` installs to `~/.copilot/`

## Current State Analysis

The repository contains only `WorkShaping.md` (requirements exploration) and PAW workflow artifacts. No extension code exists yet.

**Key patterns from reference project** (CodeResearch.md):
- Extension activates on `onStartupFinished`, installs agents to prompts directory
- Skills served via Language Model Tools (`vscode.lm.registerTool`) in VS Code
- CLI package separately installs to `~/.copilot/agents/` and `~/.copilot/skills/`
- Agent files use conditional blocks (`{{#vscode}}`, `{{#cli}}`) for environment-specific behavior
- TypeScript utilities for skill/agent loading (`src/skills/skillLoader.ts`, `src/agents/installer.ts`)

**Constraints**:
- VS Code ^1.85.0 compatibility
- Node.js 18.0.0+ for CLI package
- Single skill, single agent (simpler than reference project)
- Annotation utilities are new (not from reference)

## Desired End State

A publishable VS Code extension AND CLI package where:
1. Extension installs from Marketplace and activates without errors
2. Agent file is installed to VS Code's prompts directory on activation (`~/.config/Code/User/prompts/` on Linux)
3. Copilot CLI skill is accessible via Language Model Tool (VS Code)
4. CLI package installs skill and agent to `~/.copilot/agents/` and `~/.copilot/skills/` for terminal users
5. User can invoke annotation workflow via CLI (terminal) or Chat (VS Code)
6. Annotations written in correct `> [!COMMENT]` format
7. TypeScript utilities correctly parse/write annotation blocks

**Verification approach**: Extension builds, passes lint/tests, packages as VSIX; CLI package installs correctly; skill/agent execute annotation workflow successfully in both environments.

## What We're NOT Doing

- Manual annotation UI (selection-based, CodeLens, sidebar panel) — future scope
- Preview pane integration
- Multi-file batch annotation
- Custom verdict types beyond Accept/Reject/Skip/Question
- Export/reporting features
- Monorepo structure with separate `packages/` — using single repo with `cli/` subdirectory

## Phase Status

- [x] **Phase 1: Extension Shell** - Package structure, activation, build tooling
- [x] **Phase 2: TypeScript Annotation Utilities** - Parser, writer, types for `> [!COMMENT]` blocks
- [ ] **Phase 3: Skill and Agent Content** - SKILL.md and .agent.md files with conditional blocks
- [ ] **Phase 4: Skill/Agent Infrastructure** - Loader, installer, Language Model Tools
- [ ] **Phase 5: CLI Installer Package** - npm package for terminal Copilot CLI users
- [ ] **Phase 6: Documentation** - README, Docs.md, marketplace assets

## Phase Candidates

<!-- None currently — all features fit in defined phases -->

---

## Phase 1: Extension Shell

Establish the VS Code extension foundation: package manifest, entry point, TypeScript build, linting, and test infrastructure.

### Changes Required

- **`package.json`**: Extension manifest with:
  - name: `markdown-commenter`
  - publisher: `erdem-tuna`
  - displayName: `Markdown Commenter`
  - engines: `{ "vscode": "^1.85.0" }`
  - activationEvents: `["onStartupFinished"]`
  - main: `./out/extension.js`
  - contributes: `{ "configuration": {...} }` (placeholder for prompt directory setting)
  - scripts: compile, watch, lint, test, package
  - devDependencies: typescript, @types/vscode, eslint, vsce

- **`tsconfig.json`**: TypeScript configuration following reference project pattern:
  - module: commonjs, target: ES2020, outDir: out, rootDir: src, strict: true

- **`.eslintrc.json`**: ESLint configuration for TypeScript

- **`.vscodeignore`**: VSIX packaging exclusions (src/, node_modules/, etc.)

- **`.gitignore`**: Standard ignores (out/, node_modules/, *.vsix)

- **`src/extension.ts`**: Minimal activation function:
  - Create output channel for logging
  - Log activation message
  - Placeholder for agent installation (Phase 4)
  - Placeholder for tool registration (Phase 4)

- **Tests**: `src/test/` directory with:
  - `runTest.ts`: Test runner setup
  - `extension.test.ts`: Activation smoke test

### Success Criteria

#### Automated Verification:
- [x] `npm install` completes without errors
- [x] `npm run compile` produces `out/extension.js` without TypeScript errors
- [x] `npm run lint` passes with no errors
- [x] `npm test` passes (activation test)

#### Manual Verification:
- [ ] Extension loads in VS Code Extension Development Host (F5)
- [ ] "Markdown Commenter" appears in output channel dropdown
- [ ] `npm run package` produces `markdown-commenter-*.vsix`

---

## Phase 2: TypeScript Annotation Utilities

Create the annotation parsing and writing library that both the skill/agent and future manual annotation features will use.

### Changes Required

- **`src/annotations/types.ts`**: Type definitions:
  - `Verdict` type: `'Accept' | 'Reject' | 'Skip' | 'Question'`
  - `Annotation` interface: `{ id: string, status: Verdict, re?: string, comment?: string }`
  - `AnnotatedBlock` interface: `{ annotation: Annotation, startLine: number, endLine: number }`

- **`src/annotations/parser.ts`**: Parse existing annotations:
  - `parseAnnotation(blockText: string): Annotation | null` — Parse a single `> [!COMMENT]` block
  - `findAnnotations(content: string): AnnotatedBlock[]` — Find all annotation blocks in file content
  - Regex pattern: matches `> [!COMMENT]` followed by `> **ID**:`, `> **Status**:`, optional `> **Re**:`, optional body lines

- **`src/annotations/writer.ts`**: Generate annotation blocks:
  - `generateId(): string` — 8-character random alphanumeric ID
  - `formatAnnotation(annotation: Annotation): string` — Format as multi-line callout block
  - `insertAnnotation(content: string, lineNumber: number, annotation: Annotation): string` — Insert after specified line

- **`src/annotations/index.ts`**: Barrel export for public API

- **Tests**: `src/test/annotations/`
  - `parser.test.ts`: Parse valid blocks, handle malformed, extract all fields
  - `writer.test.ts`: Format all verdict types, with/without Re, with/without comment
  - `integration.test.ts`: Round-trip (write then parse produces same annotation)

### Success Criteria

#### Automated Verification:
- [x] `npm run compile` passes with new files
- [x] `npm run lint` passes
- [x] `npm test` passes — all annotation utility tests

#### Manual Verification:
- [ ] Sample annotation block parses correctly (verify in debug console)
- [ ] Generated annotation blocks render correctly on GitHub (paste into gist/issue)

---

## Phase 3: Skill and Agent Content

Create the Copilot CLI skill and VS Code Chat agent definition files containing the annotation workflow instructions. Agent file includes conditional blocks for VS Code vs CLI environments.

### Changes Required

- **`skills/annotate/SKILL.md`**: Copilot CLI skill definition:
  - YAML frontmatter: `name: annotate`, `description: AI-assisted markdown annotation...`
  - Workflow instructions for the agent:
    1. Read file content
    2. Identify reviewable items (finding detection heuristics)
    3. Present each item with context, ask for verdict
    4. Handle Question verdict (provide clarification)
    5. Write annotation block after item
    6. Track progress ("Finding 3 of 12")
    7. Produce session summary at end
  - Output handling: in-place vs. separate file
  - Resume logic: skip already-annotated items
  - Edge cases: empty file, no findings, malformed markdown

- **`agents/Annotate.agent.md`**: Chat agent definition with conditional blocks:
  - YAML frontmatter: `description: 'Annotate - AI-assisted markdown annotation'`
  - `{{#vscode}}` blocks: Use Language Model Tool to get skill content
  - `{{#cli}}` blocks: Read skill directly from `skills/annotate/SKILL.md`
  - Core workflow instructions (shared between environments)
  - VS Code-specific context (active editor, file path)
  - CLI-specific context (file path from user input)

- **`src/agents/agentTemplateRenderer.ts`**: Conditional block processor:
  - `processConditionalBlocks(content, environment)` — keeps matching blocks, removes others
  - Supports `{{#vscode}}...{{/vscode}}` and `{{#cli}}...{{/cli}}` syntax

### Success Criteria

#### Automated Verification:
- [ ] `npm run lint` passes (markdown files don't need linting, but verify no regressions)
- [ ] YAML frontmatter validates (name/description present)
- [ ] Conditional block processor correctly strips/retains blocks based on environment

#### Manual Verification:
- [ ] Skill content follows SKILL.md format conventions (verified against reference project)
- [ ] Agent content follows .agent.md format conventions
- [ ] Workflow instructions cover all FR requirements from Spec.md
- [ ] VS Code-processed agent references skill tool; CLI-processed agent references file path

---

## Phase 4: Skill/Agent Infrastructure

Wire up the skill loading, agent installation, and Language Model Tool registration so Copilot can access the skill and agent.

### Changes Required

- **`src/agents/platformDetection.ts`**: Platform detection utilities:
  - `getPlatformInfo()` — Detect OS (macOS, Windows, Linux)
  - `resolvePromptsDirectory(platform, customPath?)` — Return prompts path

- **`src/agents/installer.ts`**: Agent installation:
  - `InstallationState` interface for version tracking
  - `needsInstallation(context, extensionUri, promptsDir)` — Check if install needed
  - `installAgents(context, outputChannel)` — Copy agent files to prompts dir
  - Version tracking via `globalState`
  - Development version (`-dev`) always reinstalls

- **`src/agents/agentTemplates.ts`**: Agent loading:
  - `AgentTemplate` interface
  - `loadAgentTemplates(extensionUri)` — Read .agent.md files from agents/ dir

- **`src/skills/skillLoader.ts`**: Skill loading:
  - `SkillCatalogEntry` interface
  - `SkillContent` interface
  - `parseSkillFrontmatter(content)` — Extract name/description
  - `loadSkillCatalog(extensionUri)` — List available skills
  - `loadSkillContent(extensionUri, skillName)` — Get full skill content

- **`src/tools/skillTool.ts`**: Language Model Tool for skill retrieval:
  - Register `annotate_get_skill` tool via `vscode.lm.registerTool()`
  - Returns skill content when invoked by agent

- **`src/extension.ts`**: Update activation:
  - Call `installAgentsIfNeeded()` on activation
  - Register skill tool
  - Log results to output channel

- **`package.json`**: Add languageModelTools contribution:
  ```json
  "contributes": {
    "languageModelTools": [{
      "name": "annotate_get_skill",
      "displayName": "Get Annotation Skill",
      "description": "Returns the annotation skill content"
    }]
  }
  ```

- **Tests**: 
  - `src/test/agents/installer.test.ts`: Installation state, version comparison
  - `src/test/skills/skillLoader.test.ts`: Frontmatter parsing, catalog loading

### Success Criteria

#### Automated Verification:
- [ ] `npm run compile` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes — all infrastructure tests

#### Manual Verification:
- [ ] Extension activates and installs agent to prompts directory
- [ ] Agent appears in VS Code Copilot Chat agent picker
- [ ] Invoking skill tool in Copilot returns skill content
- [ ] Annotation workflow executes (basic: identify findings, write annotation)

---

## Phase 5: CLI Installer Package

Create the npm package that terminal Copilot CLI users can run to install skill and agent to `~/.copilot/`. Follows PAW's `cli/` directory pattern.

### Changes Required

- **`cli/package.json`**: CLI package manifest:
  - name: `@erdem-tuna/markdown-commenter`
  - version: synced with extension
  - bin: `{ "markdown-commenter": "bin/cli.js" }`
  - files: `["bin", "dist", "lib"]`
  - engines: `{ "node": ">=18.0.0" }`

- **`cli/bin/cli.js`**: Entry point (shebang, loads lib)

- **`cli/lib/installer.ts`**: Installation logic:
  - `install(target)` — install to copilot or claude
  - `uninstall()` — remove installed files
  - `list()` — show installed version
  - Platform detection for target directories
  - Manifest tracking (`~/.paw/markdown-commenter/manifest.json`)

- **`cli/lib/builder.ts`**: Build distribution:
  - Process agent conditional blocks for CLI environment
  - Copy skills and agents to `dist/`
  - Inject version metadata

- **`cli/scripts/build.sh`**: Build script for distribution

- **`cli/dist/`**: Built distribution (gitignored):
  - `agents/Annotate.agent.md` (CLI-processed, no `{{#vscode}}` blocks)
  - `skills/annotate/SKILL.md`

- **`cli/README.md`**: CLI package documentation:
  - Installation: `npx @erdem-tuna/markdown-commenter install copilot`
  - Commands: install, uninstall, list
  - What gets installed

### Success Criteria

#### Automated Verification:
- [ ] `cd cli && npm install` completes
- [ ] `cd cli && npm run build` produces `dist/` with processed files
- [ ] `cd cli && npm run lint` passes
- [ ] `cd cli && npm test` passes

#### Manual Verification:
- [ ] `node cli/bin/cli.js install copilot` installs to `~/.copilot/`
- [ ] `ls ~/.copilot/skills/annotate/SKILL.md` exists after install
- [ ] `ls ~/.copilot/agents/Annotate.agent.md` exists after install
- [ ] `node cli/bin/cli.js list` shows installed version
- [ ] `node cli/bin/cli.js uninstall` removes installed files

---

## Phase 6: Documentation

Create documentation for users and maintainers, including Docs.md technical reference and README for marketplace.

### Changes Required

- **`.paw/work/markdown-commenter-extension/Docs.md`**: Technical reference (load `paw-docs-guidance`):
  - Architecture overview (dual distribution model)
  - Annotation format specification
  - Skill/agent workflow description
  - TypeScript API documentation
  - Configuration options
  - Development setup instructions

- **`README.md`**: Marketplace-facing documentation:
  - Feature overview with screenshots/GIFs
  - Installation instructions (VS Code Marketplace AND CLI)
  - Quick start guide (invoke annotation workflow)
  - Annotation format reference
  - Configuration options
  - Troubleshooting
  - Contributing guidelines

- **`CHANGELOG.md`**: Initial release notes

- **`LICENSE`**: MIT license

- **`images/icon.png`**: Extension icon for marketplace:
  - 256×256 PNG, square aspect ratio
  - Simple recognizable design (comment bubble, annotation marker, or similar)
  - Referenced in package.json as `"icon": "images/icon.png"`

- **`.vscode/extensions.json`**: Recommended extensions for development

### Success Criteria

#### Automated Verification:
- [ ] `npm run lint` passes (no regressions)
- [ ] All markdown files have valid syntax

#### Manual Verification:
- [ ] README renders correctly on GitHub
- [ ] README has compelling feature description
- [ ] README covers both VS Code and CLI installation
- [ ] Docs.md covers all implemented functionality
- [ ] Extension description in package.json is accurate
- [ ] Icon displays correctly in VS Code Extensions view

---

## References

- Issue: none
- Spec: `.paw/work/markdown-commenter-extension/Spec.md`
- Research: `.paw/work/markdown-commenter-extension/CodeResearch.md`
- Work Shaping: `./WorkShaping.md`
- Reference Project: `/home/erdemtuna/workspace/personal/phased-agent-workflow`
- Reference CLI: `/home/erdemtuna/workspace/personal/phased-agent-workflow/cli`
