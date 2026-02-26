---
date: 2026-02-26T12:45:00+00:00
git_commit: c14ac5d
branch: feature/github-actions-cicd
repository: markdown-commenter
topic: "GitHub Actions CI/CD Implementation Patterns"
tags: [research, codebase, github-actions, ci-cd, workflows]
status: complete
last_updated: 2026-02-26
---

# Research: GitHub Actions CI/CD Implementation Patterns

## Research Question

What are the implementation patterns, file structures, and technical details needed to create GitHub Actions workflows for markdown-commenter, based on PAW's existing workflows?

## Summary

PAW provides mature GitHub Actions workflows that can be directly adapted for markdown-commenter. The three workflows (PR checks, extension release, CLI publish) follow consistent patterns: tag-triggered releases, version extraction from tags, pre-release detection, and idempotent release creation. The token linting infrastructure requires `@dqbd/tiktoken` dependency and two scripts. markdown-commenter already has the necessary npm scripts for lint/compile/test but lacks agent linting scripts.

## Documentation System

- **Framework**: markdown (README.md only)
- **Docs Directory**: N/A (no dedicated docs folder)
- **Navigation Config**: N/A
- **Style Conventions**: Standard GitHub README with badges, features list, installation instructions
- **Build Command**: N/A
- **Standard Files**: README.md (root), CHANGELOG.md (root), LICENSE (root)

## Verification Commands

- **Test Command**: `npm test` (extension), `cd cli && npm test` (CLI - currently no tests)
- **Lint Command**: `npm run lint` (eslint on src/)
- **Build Command**: `npm run compile` (TypeScript compilation)
- **Type Check**: Implicit via `npm run compile` (tsc)
- **Package Command**: `npm run package` (vsce package)

## Detailed Findings

### PAW PR Checks Workflow

**Location**: `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/pr-checks.yml`

**Trigger Configuration** (lines 6-16):
```yaml
on:
  pull_request:
    branches:
      - main
      - 'feature/**'
    paths:
      - 'src/**'
      - 'agents/**'
      - 'skills/**'
      - 'scripts/**'
      - '.github/workflows/pr-checks.yml'
```

**Job Structure** (lines 18-66):
- Single job named `test` on `ubuntu-latest`
- Node.js 20 with npm caching via `cache-dependency-path: package-lock.json`
- Steps: checkout → setup-node → npm ci → lint → compile → xvfb test → agent lint → summary

**xvfb Pattern** (lines 43-54):
```bash
sudo apt-get update
sudo apt-get install -y xvfb
xvfb-run -a npm test
```
Environment variable `DISPLAY: ':99.0'` set for headless testing.

**Agent Linting** (line 57):
```bash
npm run lint:agent:all
```

### PAW Extension Release Workflow

**Location**: `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/release.yml`

**Trigger** (lines 6-9):
```yaml
on:
  push:
    tags:
      - 'v*'
```

**Permissions** (lines 15-16):
```yaml
permissions:
  contents: write  # Required to create releases and upload assets
```

**Version Extraction Pattern** (lines 35-43):
```bash
TAG_NAME="${{ github.ref_name }}"
VERSION="${TAG_NAME#v}"  # Remove 'v' prefix
echo "version=${VERSION}" >> $GITHUB_OUTPUT
```

**Package.json Version Update** (lines 45-53):
```bash
npm version ${TAG_VERSION} --no-git-tag-version --allow-same-version
```
This makes the git tag the source of truth for versioning.

**Pre-release Detection** (lines 55-71):
```bash
MINOR=$(echo $VERSION | cut -d. -f2)
if [ $((MINOR % 2)) -eq 1 ]; then
  echo "is_prerelease=true" >> $GITHUB_OUTPUT
else
  echo "is_prerelease=false" >> $GITHUB_OUTPUT
fi
```
Odd minor versions (0.1.x, 0.3.x) are pre-releases.

**VSIX Verification** (lines 78-89):
```bash
VSIX_FILE="paw-workflow-${{ steps.version.outputs.version }}.vsix"
if [ ! -f "$VSIX_FILE" ]; then
  exit 1
fi
```
Package name from package.json determines VSIX filename.

**Release Existence Check** (lines 91-101):
```bash
RELEASE_EXISTS=$(gh release view "${{ github.ref_name }}" --json id 2>/dev/null || echo "")
```
Uses GitHub CLI to check; skips creation if exists (idempotent).

**Release Creation** (lines 103-115):
Uses `softprops/action-gh-release@v1` action with:
- `files:` for VSIX attachment
- `prerelease:` from detection step
- `fail_on_unmatched_files: true`

### PAW CLI Publish Workflow

**Location**: `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/publish-cli.yml`

**Trigger** (lines 3-6):
```yaml
on:
  push:
    tags:
      - 'cli-v*'
```

**Permissions** (lines 8-10):
```yaml
permissions:
  id-token: write  # Required for OIDC trusted publishing
  contents: write  # Required to create GitHub releases
```

**Working Directory Default** (lines 15-17):
```yaml
defaults:
  run:
    working-directory: cli
```

**Node.js Setup with Registry** (lines 22-26):
```yaml
uses: actions/setup-node@v4
with:
  node-version: '24'
  registry-url: 'https://registry.npmjs.org'
```
Note: Uses Node 24 (newer than extension workflow).

**CLI Version Extraction** (lines 28-34):
```bash
VERSION="${TAG_NAME#cli-v}"  # Remove 'cli-v' prefix
```

**CLI Pre-release Detection** (lines 36-49):
```bash
if [[ "$VERSION" =~ -(alpha|beta|rc) ]]; then
  echo "npm_tag=beta" >> $GITHUB_OUTPUT
else
  echo "npm_tag=latest" >> $GITHUB_OUTPUT
fi
```
Uses semver suffix pattern, not odd/even minor.

**npm Publish with OIDC** (line 64):
```bash
npm publish --access public --tag ${{ steps.prerelease.outputs.npm_tag }}
```
No `NPM_TOKEN` needed; OIDC provides authentication via `id-token: write` permission.

### PAW Token Linting Scripts

**lint-prompting.sh Location**: `/home/erdemtuna/workspace/personal/phased-agent-workflow/scripts/lint-prompting.sh`

**Token Thresholds** (lines 10-16):
```bash
WARN_THRESHOLD=5000
ERROR_THRESHOLD=7000
SKILL_WARN_THRESHOLD=8000
SKILL_ERROR_THRESHOLD=12000
```

**Dependency Check** (lines 31-35):
```bash
if [ ! -d "node_modules/@dqbd/tiktoken" ]; then
    echo -e "${RED}ERROR: Dependencies are not installed${NC}"
    exit 1
fi
```

**Agent File Pattern** (line 104):
```bash
local files=("$agent_dir"/*.agent.md)
```
Expects `agents/*.agent.md` naming convention.

**Skill File Pattern** (line 132):
```bash
find "$skill_dir" -name "SKILL.md" -type f -print0
```
Expects `skills/*/SKILL.md` naming convention.

**CLI Arguments** (lines 161-175):
- No args: lint all agents
- `--skills`: lint only skills
- `--all`: lint both agents and skills

**count-tokens.js Location**: `/home/erdemtuna/workspace/personal/phased-agent-workflow/scripts/count-tokens.js`

**tiktoken Usage** (lines 9, 81):
```javascript
const { encoding_for_model } = require('@dqbd/tiktoken');
const encoding = encoding_for_model(model);
```
Uses `gpt-4o-mini` as default model (line 20).

**PAW-Specific Template Expansion** (lines 62-72):
The script has PAW-specific logic to expand `{{PLACEHOLDER}}` patterns in agent files. This uses `ts-node` to load `src/agents/agentTemplateRenderer`. markdown-commenter does not have this pattern, so this section can be simplified or removed.

### markdown-commenter Current Structure

**package.json Location**: `/home/erdemtuna/workspace/personal/markdown-commenter/package.json`

**Existing Scripts** (lines 111-123):
```json
"scripts": {
  "vscode:prepublish": "npm run compile",
  "compile": "tsc -p ./",
  "watch": "tsc -watch -p ./",
  "lint": "eslint src --ext ts",
  "test": "node ./out/test/runTest.js",
  "package": "vsce package"
}
```

**Missing Scripts**:
- `lint:agent` - single agent file linting
- `lint:agent:all` - lint all agents and skills
- `lint:skills` - lint only skills

**Package Name** (line 2): `markdown-commenter`
VSIX will be named `markdown-commenter-<version>.vsix`

**Publisher** (line 7): `erdem-tuna`
Required for VS Code Marketplace publishing.

**Existing DevDependencies** (lines 124-136):
- `@vscode/vsce` already present for VSIX packaging
- `@dqbd/tiktoken` NOT present (needs to be added)
- `ts-node` NOT present (only needed if using template expansion)

**cli/package.json Location**: `/home/erdemtuna/workspace/personal/markdown-commenter/cli/package.json`

**Package Scope** (line 2): `@erdem-tuna/markdown-commenter`
This is the npm package name for publishing.

**CLI Scripts** (lines 17-21):
```json
"scripts": {
  "build": "node scripts/build.js",
  "test": "node --test lib/*.test.js",
  "lint": "echo 'No lint configured for CLI package'"
}
```

**CLI Test Status**: No test files exist (`lib/*.test.js` pattern matches nothing).
PR checks can still run `npm test` which will pass with no tests.

### Agent/Skill File Structure

**Agent File**: `/home/erdemtuna/workspace/personal/markdown-commenter/agents/Annotate.agent.md`
- Single agent file
- Standard naming convention (matches `*.agent.md` pattern)

**Skill File**: `/home/erdemtuna/workspace/personal/markdown-commenter/skills/annotate/SKILL.md`
- Single skill in `annotate/` subdirectory
- Matches `skills/*/SKILL.md` pattern expected by lint script

## Code References

### PAW Workflows
- `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/pr-checks.yml:1-66` - PR checks workflow
- `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/release.yml:1-116` - Extension release workflow
- `/home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/publish-cli.yml:1-92` - CLI publish workflow

### PAW Linting Scripts
- `/home/erdemtuna/workspace/personal/phased-agent-workflow/scripts/lint-prompting.sh:1-227` - Token linting bash script
- `/home/erdemtuna/workspace/personal/phased-agent-workflow/scripts/count-tokens.js:1-97` - Token counting Node.js script

### markdown-commenter Targets
- `/home/erdemtuna/workspace/personal/markdown-commenter/package.json:111-123` - Existing npm scripts
- `/home/erdemtuna/workspace/personal/markdown-commenter/cli/package.json:17-21` - CLI scripts
- `/home/erdemtuna/workspace/personal/markdown-commenter/agents/Annotate.agent.md` - Agent file to lint
- `/home/erdemtuna/workspace/personal/markdown-commenter/skills/annotate/SKILL.md` - Skill file to lint

## Architecture Documentation

### Workflow Patterns

1. **Tag-Triggered Releases**: Both extension (`v*`) and CLI (`cli-v*`) use tag push triggers. This decouples versioning from code changes.

2. **Version Source of Truth**: Git tag determines version; package.json is updated at build time via `npm version --no-git-tag-version`.

3. **Idempotent Release Creation**: Check if release exists before creating; skip if already exists. Prevents duplicate releases on re-runs.

4. **Pre-release Detection**: Extension uses odd/even minor version convention; CLI uses semver suffix (`-alpha`, `-beta`, `-rc`).

5. **Graceful Degradation**: For Marketplace publishing, continue on failure so GitHub Release is still created (specified in WorkShaping, not implemented in PAW's current workflow—needs to be added).

### Token Linting Patterns

1. **Threshold Tiers**: Warning threshold allows PR to pass with notice; error threshold fails the build.

2. **File Discovery**: Agent files via glob pattern; skill files via `find` command for nested structure.

3. **Dependency Validation**: Script checks for `@dqbd/tiktoken` in node_modules before proceeding.

## Adaptations Required for markdown-commenter

### Simplifications from PAW

1. **count-tokens.js**: Remove PAW-specific template expansion logic (lines 28-72). markdown-commenter agents don't use `{{PLACEHOLDER}}` patterns.

2. **Node Version**: Can use Node 20 for CLI workflow (PAW uses 24, but 20 is sufficient and consistent with extension workflow).

### Additions to PAW Patterns

1. **VS Code Marketplace Publishing**: PAW's `release.yml` only creates GitHub Release. Need to add `vsce publish` step with `VSCE_PAT` secret.

2. **Marketplace Failure Handling**: Add `continue-on-error: true` to Marketplace step so GitHub Release is still created on failure.

3. **CLI Path in PR Checks**: PAW doesn't run CLI tests in PR checks. Need to add `cd cli && npm test` step.

### Files to Create

1. `.github/workflows/pr-checks.yml` - PR quality gates
2. `.github/workflows/release.yml` - Extension release + Marketplace
3. `.github/workflows/publish-cli.yml` - CLI npm publish
4. `scripts/lint-prompting.sh` - Token linting script
5. `scripts/count-tokens.js` - Token counting utility (simplified)

### Package.json Updates

1. Add `@dqbd/tiktoken` to devDependencies
2. Add npm scripts: `lint:agent`, `lint:agent:all`, `lint:skills`

## Open Questions

None - all implementation details are documented with sufficient precision for planning.
