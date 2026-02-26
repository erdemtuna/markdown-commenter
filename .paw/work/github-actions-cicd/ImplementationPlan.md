# GitHub Actions CI/CD Implementation Plan

## Overview

Implementing automated CI/CD infrastructure for markdown-commenter, consisting of three GitHub Actions workflows (PR checks, extension release, CLI publish) and supporting token linting scripts. The implementation directly adapts PAW's mature workflow patterns, customized for markdown-commenter's package structure and publishing requirements.

## Current State Analysis

**Existing infrastructure**:
- VS Code extension with `npm run lint`, `compile`, `test`, `package` scripts (package.json:111-123)
- CLI package with `npm run build`, `test` scripts (cli/package.json:17-21)
- Agent file at `agents/Annotate.agent.md`
- Skill file at `skills/annotate/SKILL.md`
- `@vscode/vsce` already in devDependencies for VSIX packaging

**Gaps**:
- No `.github/workflows/` directory or workflow files
- No `scripts/` directory for linting utilities
- No `@dqbd/tiktoken` dependency for token counting
- No `lint:agent*` npm scripts

**Key constraints**:
- VSIX filename will be `markdown-commenter-<version>.vsix` (from package.json name)
- npm package scope is `@erdem-tuna/markdown-commenter` (cli/package.json:2)
- Publisher ID is `erdem-tuna` (package.json:7)

## Desired End State

1. **PR Checks**: Every PR to main runs lint, compile, extension tests, CLI tests, and agent linting
2. **Extension Release**: Pushing `v*` tag creates GitHub Release with VSIX and publishes to VS Code Marketplace
3. **CLI Publish**: Pushing `cli-v*` tag publishes to npm with OIDC provenance and creates GitHub Release
4. **Token Linting**: Local and CI execution of agent/skill token validation

**Verification approach**: 
- Create test PR to verify PR checks workflow
- Push test tag to verify release workflow (can use pre-release version like `v0.0.2`)
- Verify npm scripts work locally before pushing

## What We're NOT Doing

- MkDocs documentation workflow (no docs framework in use)
- Automatic changelog generation
- Release notes automation
- Slack/Discord notifications
- Code coverage reporting
- Security scanning (CodeQL, Dependabot)
- Matrix testing across Node versions
- Windows/macOS runner support

## Phase Status

- [ ] **Phase 1: Token Linting Infrastructure** - Add scripts and dependencies for agent/skill token validation
- [ ] **Phase 2: PR Checks Workflow** - Automated quality gates on pull requests
- [ ] **Phase 3: Extension Release Workflow** - Tag-triggered VSIX build, GitHub Release, and Marketplace publishing
- [ ] **Phase 4: CLI Publish Workflow** - Tag-triggered npm publish with OIDC
- [ ] **Phase 5: Documentation** - Technical reference and README updates

## Phase Candidates

<!-- Empty - all phases determined -->

---

## Phase 1: Token Linting Infrastructure

### Changes Required

- **`scripts/lint-prompting.sh`**: Copy from PAW (`/home/erdemtuna/workspace/personal/phased-agent-workflow/scripts/lint-prompting.sh`), no modifications needed—script is generic and works with standard `agents/*.agent.md` and `skills/*/SKILL.md` patterns

- **`scripts/count-tokens.js`**: Simplified version of PAW's script, removing template expansion logic (lines 28-72 in PAW version). markdown-commenter agents don't use `{{PLACEHOLDER}}` patterns. Keep core functionality:
  - tiktoken integration for token counting
  - File path argument handling
  - Model parameter (default: `gpt-4o-mini`)

- **`package.json`**: 
  - Add `@dqbd/tiktoken` to devDependencies
  - Add scripts:
    ```
    "lint:agent": "./scripts/lint-prompting.sh",
    "lint:agent:all": "./scripts/lint-prompting.sh --all",
    "lint:skills": "./scripts/lint-prompting.sh --skills"
    ```

### Success Criteria

#### Automated Verification:
- [ ] `npm run lint:agent` passes (lints agents/Annotate.agent.md)
- [ ] `npm run lint:skills` passes (lints skills/annotate/SKILL.md)
- [ ] `npm run lint:agent:all` passes (lints both)

#### Manual Verification:
- [ ] Output shows token counts with colored OK/WARN/ERROR status
- [ ] Script fails with exit code 1 when token threshold exceeded (can test by temporarily lowering threshold)

---

## Phase 2: PR Checks Workflow

### Changes Required

- **`.github/workflows/pr-checks.yml`**: Create workflow adapted from PAW pattern with:
  - Trigger: `pull_request` to `main` branch
  - Path filtering: `src/**`, `agents/**`, `skills/**`, `cli/**`, `scripts/**`, `.github/workflows/pr-checks.yml`
  - Job steps:
    1. Checkout code
    2. Setup Node.js 20 with npm cache
    3. `npm ci` (root dependencies)
    4. `npm run lint` (TypeScript linting)
    5. `npm run compile` (build extension)
    6. xvfb setup + `npm test` (VS Code extension tests)
    7. `cd cli && npm ci && npm test` (CLI tests — currently no test files exist, step passes vacuously)
    8. `npm run lint:agent:all` (agent/skill token linting)
    9. Summary message on success

**Differences from PAW**:
- Add CLI test step (PAW doesn't run CLI tests in PR checks)
- Add `cli/**` to path filter

### Success Criteria

#### Automated Verification:
- [ ] Workflow YAML is valid (no syntax errors on push)
- [ ] All steps complete successfully on test PR

#### Manual Verification:
- [ ] PR shows GitHub Actions check status
- [ ] Intentional lint error causes workflow failure
- [ ] Path filtering works (docs-only change skips workflow)

---

## Phase 3: Extension Release Workflow

### Changes Required

- **`.github/workflows/release.yml`**: Create workflow adapted from PAW with Marketplace publishing added:
  - Trigger: `push` tags matching `v*`
  - Permissions: `contents: write`
  - Job steps:
    1. Checkout code
    2. Setup Node.js 20 with npm cache
    3. `npm ci`
    4. `npm run compile`
    5. Extract version from tag (remove `v` prefix)
    6. Update package.json version via `npm version --no-git-tag-version`
    7. Determine pre-release status (odd minor = pre-release)
    8. `npm run package` (create VSIX)
    9. Verify VSIX exists with expected filename (`markdown-commenter-<version>.vsix`)
    10. Check if GitHub Release exists (skip if yes)
    11. Create GitHub Release with VSIX attached (using `softprops/action-gh-release@v1`)
    12. Publish to VS Code Marketplace via `vsce publish` (with `continue-on-error: true`)

**Marketplace publishing step** (new vs PAW):
```yaml
- name: Publish to VS Code Marketplace
  continue-on-error: true  # Don't fail workflow if Marketplace upload fails
  run: npx vsce publish --pat ${{ secrets.VSCE_PAT }}
  env:
    VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

**Inline documentation comments** to add:
- How to obtain VSCE_PAT (Azure DevOps PAT with Marketplace scope)
- Pre-release versioning convention explanation
- Why `continue-on-error` is used for Marketplace step

### Success Criteria

#### Automated Verification:
- [ ] Workflow YAML is valid
- [ ] Pushing test tag creates GitHub Release with VSIX attached

#### Manual Verification:
- [ ] Pre-release tag (e.g., `v0.1.0`) creates pre-release
- [ ] Stable tag (e.g., `v0.2.0`) creates stable release
- [ ] Duplicate tag push skips release creation
- [ ] Marketplace failure logs warning but Release still created

---

## Phase 4: CLI Publish Workflow

### Changes Required

- **`.github/workflows/publish-cli.yml`**: Create workflow adapted from PAW:
  - Trigger: `push` tags matching `cli-v*`
  - Permissions: `id-token: write` (OIDC), `contents: write` (releases)
  - Default working directory: `cli`
  - Job steps:
    1. Checkout code
    2. Setup Node.js 20 with registry-url for npm
    3. Extract version from tag (remove `cli-v` prefix)
    4. Determine pre-release status (check for `-alpha`, `-beta`, `-rc` suffix)
    5. Set package.json version via `npm version --no-git-tag-version`
    6. `npm ci`
    7. `npm run build`
    8. `npm test`
    9. `npm publish --access public --tag <latest|beta>` (OIDC auth)
    10. Check if GitHub Release exists (working-directory override to repo root)
    11. Create GitHub Release

**Prerequisites for npm OIDC**:
- cli/package.json must have `"publishConfig": { "provenance": true }` for OIDC to work
- Package must be linked to GitHub repository in npm settings
- First publish may require manual setup on npmjs.com

**Inline documentation comments** to add:
- npm OIDC setup requirements (package must be configured for provenance)
- Pre-release npm tag convention (`beta` vs `latest`)
- Why Node 20 (not 24 like PAW—consistency with extension workflow)

### Success Criteria

#### Automated Verification:
- [ ] Workflow YAML is valid
- [ ] Pushing test tag triggers workflow

#### Manual Verification:
- [ ] npm package published with provenance
- [ ] GitHub Release created with npm package link
- [ ] Pre-release suffix correctly sets npm tag to `beta`

---

## Phase 5: Documentation

### Changes Required

- **`.paw/work/github-actions-cicd/Docs.md`**: Technical reference covering:
  - Overview of CI/CD infrastructure
  - Workflow descriptions and triggers
  - Token linting thresholds and usage
  - Secrets configuration requirements
  - Troubleshooting common issues

- **`README.md`**: Add "Development" or "Contributing" section with:
  - How to run tests locally
  - How to lint agent files
  - Release process overview (tag → workflow → artifacts)

### Success Criteria

- [ ] Docs.md follows `paw-docs-guidance` template
- [ ] README additions are concise and actionable
- [ ] No broken links or outdated information

---

## References

- Issue: none
- Spec: `.paw/work/github-actions-cicd/Spec.md`
- Research: `.paw/work/github-actions-cicd/CodeResearch.md`
- WorkShaping: `./WorkShaping-GHActions.md`
- PAW Workflows: `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/`
