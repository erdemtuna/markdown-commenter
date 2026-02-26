# Feature Specification: GitHub Actions CI/CD

**Branch**: feature/github-actions-cicd  |  **Created**: 2026-02-26  |  **Status**: Draft
**Input Brief**: Automate build, test, and release pipelines for markdown-commenter VS Code extension and CLI

## Overview

The markdown-commenter project currently lacks automated CI/CD infrastructure. Every release requires manual execution of build commands, manual VSIX packaging, manual uploads to VS Code Marketplace, and manual npm publishing. This is error-prone, time-consuming, and doesn't scale as the project grows.

This feature establishes GitHub Actions workflows that automate quality gates on pull requests and streamline the release process for both the VS Code extension and Copilot CLI. By modeling after PAW's mature CI/CD patterns, maintainers can confidently merge PRs knowing they've passed automated checks, and release new versions by simply pushing a git tag.

The automation serves two user groups: contributors who benefit from immediate feedback on code quality, and maintainers who can release with confidence through a standardized, repeatable process. The workflows are designed for resilience—if VS Code Marketplace upload fails, the GitHub Release with downloadable VSIX is still created.

## Objectives

- Enable automated quality validation on every pull request (lint, compile, test)
- Provide one-command releases via git tags for both extension and CLI
- Publish VS Code extension to both GitHub Releases and VS Code Marketplace
- Publish CLI package to npm registry with provenance
- Enforce agent/skill token size limits to prevent oversized prompts
- Document secrets setup and release procedures inline in workflow files

## User Scenarios & Testing

### User Story P1 – Contributor Submits a Pull Request
**Narrative**: A contributor opens a PR with code changes. Within minutes, they receive feedback on whether their changes pass linting, compilation, and tests without needing to run commands locally.

**Independent Test**: Open a PR with a TypeScript syntax error; verify the workflow fails and reports the error.

**Acceptance Scenarios**:
1. Given a PR is opened to main, When the PR contains valid code, Then all checks pass and show green status
2. Given a PR is opened to main, When the PR contains a lint violation, Then the lint step fails with a clear error message
3. Given a PR is opened to main, When the PR contains a test failure, Then the test step fails showing which test failed
4. Given a PR modifies only documentation files, When no source files changed, Then the workflow is skipped (path filtering)

### User Story P2 – Maintainer Releases VS Code Extension
**Narrative**: A maintainer pushes a version tag (e.g., `v1.0.0`). The workflow builds the extension, creates a GitHub Release with the VSIX attached, and publishes to VS Code Marketplace.

**Independent Test**: Push a `v0.0.2` tag; verify GitHub Release is created with VSIX file attached.

**Acceptance Scenarios**:
1. Given a `v*` tag is pushed, When the build succeeds, Then a GitHub Release is created with the VSIX attached
2. Given a `v*` tag is pushed, When Marketplace upload fails, Then GitHub Release is still created (with warning logged)
3. Given a `v0.3.0` tag (odd minor), When the release is created, Then it is marked as pre-release
4. Given a `v0.2.0` tag (even minor), When the release is created, Then it is marked as stable release
5. Given the same tag is pushed twice, When a release already exists, Then the workflow skips release creation (idempotent)

### User Story P3 – Maintainer Releases CLI Package
**Narrative**: A maintainer pushes a CLI version tag (e.g., `cli-v1.0.0`). The workflow builds, tests, and publishes the CLI to npm, then creates a GitHub Release.

**Independent Test**: Push a `cli-v0.0.2` tag; verify npm package is published and GitHub Release is created.

**Acceptance Scenarios**:
1. Given a `cli-v*` tag is pushed, When build and tests pass, Then npm package is published with provenance
2. Given a `cli-v1.0.0-beta` tag, When published to npm, Then the package is tagged as `beta` (not `latest`)
3. Given a `cli-v*` tag is pushed, When npm publish succeeds, Then a GitHub Release is created
4. Given CLI tests fail, When the workflow runs, Then npm publish is skipped and workflow fails

### User Story P4 – Contributor Adds Large Agent File
**Narrative**: A contributor adds or modifies an agent file that exceeds token limits. The PR checks catch this before merge to prevent oversized prompts in production.

**Independent Test**: Add an agent file with 8000+ tokens; verify PR checks fail with token limit error.

**Acceptance Scenarios**:
1. Given an agent file exceeds 7000 tokens, When PR checks run, Then the lint step fails with error
2. Given an agent file is between 5000-7000 tokens, When PR checks run, Then a warning is shown but checks pass
3. Given a skill file exceeds 12000 tokens, When PR checks run, Then the lint step fails with error

### Edge Cases

- **Package.json version mismatch**: Workflow extracts version from tag and updates package.json, ensuring tag is source of truth
- **Orphaned tags**: If workflow fails mid-execution, tag remains but no release exists; maintainer can re-trigger or delete tag
- **VSCE_PAT expired**: Marketplace upload fails; GitHub Release created anyway; maintainer renews PAT and can manually publish
- **npm OIDC misconfigured**: npm publish fails; workflow fails; maintainer must fix OIDC setup before retry
- **Feature branch tag**: Branch protection should prevent this; if bypassed, workflow runs but release may contain unexpected code

## Requirements

### Functional Requirements

- FR-001: PR checks workflow triggers on pull requests to main branch (Stories: P1)
- FR-002: PR checks workflow runs TypeScript linting via `npm run lint` (Stories: P1)
- FR-003: PR checks workflow compiles extension via `npm run compile` (Stories: P1)
- FR-004: PR checks workflow runs VS Code extension tests with xvfb (Stories: P1)
- FR-005: PR checks workflow runs CLI tests via `cd cli && npm test` (Stories: P1)
- FR-006: PR checks workflow runs agent/skill token linting (Stories: P1, P4)
- FR-007: PR checks workflow uses path filtering to skip on non-code changes (Stories: P1)
- FR-008: Extension release workflow triggers on `v*` tag push (Stories: P2)
- FR-009: Extension release workflow extracts version from tag and updates package.json (Stories: P2)
- FR-010: Extension release workflow determines pre-release status from version number (Stories: P2)
- FR-011: Extension release workflow packages VSIX file (Stories: P2)
- FR-012: Extension release workflow creates GitHub Release with VSIX attached (Stories: P2)
- FR-013: Extension release workflow publishes to VS Code Marketplace (Stories: P2)
- FR-014: Extension release workflow continues on Marketplace failure (Stories: P2)
- FR-015: Extension release workflow skips if release already exists (Stories: P2)
- FR-016: CLI publish workflow triggers on `cli-v*` tag push (Stories: P3)
- FR-017: CLI publish workflow builds and tests CLI package (Stories: P3)
- FR-018: CLI publish workflow publishes to npm with OIDC provenance (Stories: P3)
- FR-019: CLI publish workflow creates GitHub Release after npm publish (Stories: P3)
- FR-020: CLI publish workflow determines npm tag from version suffix (Stories: P3)
- FR-021: Token linting script counts tokens using tiktoken library (Stories: P4)
- FR-022: Token linting script enforces configurable thresholds (Stories: P4)

### Key Entities

- **Workflow**: GitHub Actions YAML file defining automated jobs
- **Tag**: Git reference triggering release workflows (`v*` or `cli-v*`)
- **VSIX**: VS Code extension package file
- **Release**: GitHub Release with attached artifacts and notes

### Cross-Cutting / Non-Functional

- Workflows must complete within GitHub Actions timeout limits (6 hours default)
- Secrets (VSCE_PAT) must be documented but not committed
- npm publishing must use OIDC (no token secrets)
- All workflows must include descriptive comments explaining purpose and setup

## Success Criteria

- SC-001: PRs receive automated feedback within 5 minutes of opening (FR-001, FR-002, FR-003, FR-004, FR-005)
- SC-002: Pushing a `v*` tag results in a GitHub Release with downloadable VSIX within 10 minutes (FR-008, FR-011, FR-012)
- SC-003: VS Code Marketplace shows the extension after successful release (FR-013)
- SC-004: npm registry shows CLI package with provenance after `cli-v*` tag push (FR-016, FR-018)
- SC-005: Agent files exceeding 7000 tokens cause PR check failure (FR-006, FR-021, FR-022)
- SC-006: Workflows are self-documenting with inline comments explaining secrets setup (FR-013, FR-018)
- SC-007: Duplicate tag push does not create duplicate release (FR-015)

## Assumptions

- **Publisher ID**: VS Code Marketplace publisher is `erdem-tuna` (from package.json)
- **npm scope**: CLI package scope is `@erdem-tuna/markdown-commenter` (from cli/package.json)
- **Token thresholds**: Use PAW defaults (5K warn, 7K error for agents; 8K warn, 12K error for skills)
- **No docs workflow**: MkDocs documentation workflow not needed for initial release
- **Branch protection**: Repository will have branch protection enabled on main (documented requirement, not enforced by workflows)
- **tiktoken compatibility**: The `@dqbd/tiktoken` package works in GitHub Actions Node.js 20 environment

## Scope

**In Scope**:
- PR checks workflow (lint, compile, test, agent lint)
- Extension release workflow (build, GitHub Release, Marketplace)
- CLI publish workflow (build, test, npm, GitHub Release)
- Token linting scripts (lint-prompting.sh, count-tokens.js)
- Inline documentation in workflow files
- npm scripts for local linting

**Out of Scope**:
- Documentation site workflow (MkDocs)
- Automatic changelog generation
- Release notes automation
- Slack/Discord notifications
- Code coverage reporting
- Security scanning (CodeQL, Dependabot)
- Matrix testing across Node versions
- Windows/macOS runner support

## Dependencies

- GitHub Actions (service)
- VS Code Marketplace API (service)
- npm registry with OIDC support (service)
- `@dqbd/tiktoken` npm package (library)
- `@vscode/vsce` for VSIX packaging (existing devDependency)
- Repository secrets: `VSCE_PAT` (for Marketplace publishing)

## Risks & Mitigations

- **VSCE_PAT expiration**: PATs expire periodically. **Mitigation**: Document renewal process in workflow comments; GitHub Release created even if Marketplace fails.
- **npm OIDC complexity**: OIDC setup requires npm package configuration. **Mitigation**: Document prerequisites clearly; test with dry-run before first real publish.
- **tiktoken version drift**: Token counting may vary across versions. **Mitigation**: Pin version in package.json.
- **Workflow maintenance burden**: Three workflows to maintain. **Mitigation**: Model closely after PAW patterns for consistency; consider composite actions in future.
- **Branch protection bypass**: Emergency hotfixes may bypass checks. **Mitigation**: Document bypass procedure; accept as intentional escape hatch.

## References

- WorkShaping: ./WorkShaping-GHActions.md
- PAW PR Checks: /home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/pr-checks.yml
- PAW Release: /home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/release.yml
- PAW CLI Publish: /home/erdemtuna/workspace/personal/phased-agent-workflow/.github/workflows/publish-cli.yml
- PAW Lint Script: /home/erdemtuna/workspace/personal/phased-agent-workflow/scripts/lint-prompting.sh
