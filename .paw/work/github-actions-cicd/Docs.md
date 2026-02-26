# GitHub Actions CI/CD

## Overview

This implementation adds automated CI/CD infrastructure to the markdown-commenter project, consisting of three GitHub Actions workflows and supporting token linting scripts. The workflows automate quality gates on pull requests and streamline the release process for both the VS Code extension and Copilot CLI package.

The automation eliminates manual release steps, ensures consistent quality validation, and follows patterns established by the PAW (Phased Agent Workflow) project. Maintainers can now release new versions by simply pushing a git tag, while contributors receive immediate feedback on code quality through PR checks.

## Architecture and Design

### High-Level Architecture

```
GitHub Repository Events
         │
         ├── PR to main ──────────► PR Checks Workflow
         │                          ├── lint
         │                          ├── compile
         │                          ├── extension tests
         │                          ├── CLI tests
         │                          └── agent linting
         │
         ├── Push v* tag ─────────► Extension Release Workflow
         │                          ├── build VSIX
         │                          ├── GitHub Release
         │                          └── VS Code Marketplace
         │
         └── Push cli-v* tag ─────► CLI Publish Workflow
                                    ├── build & test
                                    ├── npm publish
                                    └── GitHub Release
```

### Design Decisions

**Tag-triggered releases**: Releases are triggered by git tags rather than PR merges. This provides explicit control over when releases happen and separates versioning decisions from code changes.

**Separate tag patterns**: Extension uses `v*` tags (e.g., `v1.0.0`), CLI uses `cli-v*` tags (e.g., `cli-v1.0.0`). This allows independent versioning of the two packages.

**Tag as version source of truth**: Package.json versions are updated during the workflow from the git tag. Local development uses `0.0.1-dev`, ensuring agents are reinstalled on every activation during development.

**Graceful Marketplace failure**: The extension release workflow uses `continue-on-error` for Marketplace publishing. If it fails, the GitHub Release is still created with the VSIX attached, ensuring users can always access the extension.

**OIDC for npm**: CLI publishing uses npm's OIDC trusted publishing instead of access tokens. This is more secure and doesn't require storing npm tokens in repository secrets.

### Integration Points

**Token linting**: Uses `@dqbd/tiktoken` to count tokens in agent/skill files. Thresholds (5K/7K for agents, 8K/12K for skills) prevent oversized prompts that degrade LLM performance.

**VS Code test infrastructure**: Uses `xvfb` to provide a virtual display for headless VS Code testing in GitHub Actions.

## User Guide

### Prerequisites

**For PR checks** (automatic):
- No setup required — workflow runs automatically on PRs

**For extension release**:
- `VSCE_PAT` secret: Personal Access Token for VS Code Marketplace
  - Create at: https://dev.azure.com (Azure DevOps)
  - Required scopes: Marketplace (Manage)
  - Add to: Repository Settings → Secrets and variables → Actions

**For CLI publish**:
- First-time manual publish to establish npm package
- Link package to GitHub repository on npmjs.com
- Add to cli/package.json: `"publishConfig": { "provenance": true }`

### Basic Usage

**Run local linting**:
```bash
npm run lint:agent         # Lint agent files only
npm run lint:skills        # Lint skill files only
npm run lint:agent:all     # Lint both agents and skills
```

**Release a new extension version**:
```bash
git tag v0.2.0
git push origin v0.2.0
```

**Release a new CLI version**:
```bash
git tag cli-v0.2.0
git push origin cli-v0.2.0
```

### Advanced Usage

**Pre-release versions**:
- Extension: Odd minor versions (v0.1.0, v0.3.0) are marked as pre-release
- CLI: Versions with `-alpha`, `-beta`, or `-rc` suffix (cli-v1.0.0-beta)

**Re-running failed releases**:
If a release workflow fails partway through, it's safe to re-run:
- GitHub Release creation checks if release exists and skips if already present
- Marketplace/npm publish are idempotent for the same version

## API Reference

### Token Linting Scripts

**lint-prompting.sh**:
```bash
./scripts/lint-prompting.sh              # Lint all agents
./scripts/lint-prompting.sh --skills     # Lint all skills
./scripts/lint-prompting.sh --all        # Lint both
./scripts/lint-prompting.sh path/to/file # Lint specific file
```

**count-tokens.js**:
```bash
node scripts/count-tokens.js <file-path> [model]
# model defaults to 'gpt-4o-mini'
```

### Configuration Options

**Token thresholds** (in lint-prompting.sh):
| Type | Warning | Error |
|------|---------|-------|
| Agent | 5,000 | 7,000 |
| Skill | 8,000 | 12,000 |

## Testing

### How to Test

**PR Checks**:
1. Create a branch with a code change
2. Open a PR to main
3. Verify workflow triggers and all checks pass/fail as expected

**Token Linting**:
1. Run `npm run lint:agent:all` locally
2. Verify it reports correct token counts for agents/skills
3. Temporarily lower thresholds to verify failure behavior

**Release Workflows** (dry run):
1. Push a pre-release tag (e.g., `v0.0.2` or `cli-v0.0.2-alpha`)
2. Verify GitHub Release is created
3. Check workflow logs for any warnings

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Duplicate tag push | Release creation skipped (idempotent) |
| Marketplace PAT expired | Warning logged, GitHub Release still created |
| Agent exceeds 7K tokens | PR checks fail with clear error |
| npm OIDC not configured | CLI publish fails with auth error |
| No CLI test files | npm test passes (no tests = success) |

## Limitations and Future Work

**Current limitations**:
- No automatic changelog generation — release notes added manually
- No matrix testing across Node versions (only Node 20)
- No Windows/macOS runner support
- CLI tests don't exist yet (step passes vacuously)

**Not implemented** (explicit scope exclusions):
- MkDocs documentation workflow
- Slack/Discord notifications
- Code coverage reporting
- Security scanning (CodeQL, Dependabot)
