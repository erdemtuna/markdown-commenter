# Contributing to Markdown Commenter

Thank you for your interest in contributing! This guide covers development setup, workflows, and maintainer tasks.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- VS Code (for extension development)

### Build from Source

```bash
git clone https://github.com/erdemtuna/markdown-commenter
cd markdown-commenter
npm install
npm run compile
```

### Run Tests

```bash
npm test                   # Extension tests (requires VS Code)
cd cli && npm test         # CLI tests
```

### Lint

```bash
npm run lint               # TypeScript/ESLint
npm run lint:agent:all     # Agent/skill token limits
```

### Package Extension

```bash
npm run package            # Creates .vsix file
```

## Pull Request Workflow

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with tests
4. Ensure all checks pass locally:
   ```bash
   npm run lint && npm run compile && npm test
   ```
5. Submit a pull request

PRs trigger automated checks: lint, compile, test, and agent token linting.

## Release Process

Releases are automated via GitHub Actions using git tags:

| Release Type | Tag Pattern | Example |
|--------------|-------------|---------|
| Extension | `v*` | `git tag v1.2.0 && git push origin v1.2.0` |
| CLI | `cli-v*` | `git tag cli-v1.2.0 && git push origin cli-v1.2.0` |

### Version Conventions

- **Extension**: Odd minor versions (e.g., `v1.1.0`) are pre-releases
- **CLI**: Use semver suffixes for pre-releases (e.g., `cli-v1.0.0-beta.1`)

---

## Maintainer Guide

### Repository Secrets

The following GitHub Actions secrets must be configured for CI/CD:

| Secret | Required For | How to Get |
|--------|--------------|------------|
| `VSCE_PAT` | Extension releases | [Azure DevOps](https://dev.azure.com) → User Settings → Personal Access Tokens → New Token with **Marketplace (Publish)** scope |
| `NPM_TOKEN` | CLI publishing | [npmjs.com](https://www.npmjs.com/settings/~/tokens) → Access Tokens → Generate New Token (Automation) |

**Configure at:** Repository → Settings → Secrets and variables → Actions → New repository secret

### First-Time CLI Publish

The first npm publish must be done manually to establish the package:

```bash
cd cli
npm login
npm publish --access public
```

Subsequent publishes use the `NPM_TOKEN` secret automatically.

### Token Limits

Agent and skill files have token limits enforced by CI:

| File Type | Warning | Error |
|-----------|---------|-------|
| Agents (`agents/*.agent.md`) | 5,000 | 7,000 |
| Skills (`skills/*/SKILL.md`) | 8,000 | 12,000 |

Check locally with:
```bash
npm run lint:agent:all
```

### Workflow Files

- `.github/workflows/pr-checks.yml` — PR quality gates
- `.github/workflows/release.yml` — Extension release (v* tags)
- `.github/workflows/publish-cli.yml` — CLI npm publish (cli-v* tags)
