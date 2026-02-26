# Work Shaping: GitHub Actions CI/CD for markdown-commenter

## Problem Statement

**Who benefits**: Maintainers and contributors of the markdown-commenter project.

**What problem is solved**: Currently, markdown-commenter has no automated build, test, or release pipeline. Publishing the VS Code extension and Copilot CLI requires manual steps that are error-prone and time-consuming. This work establishes GitHub Actions workflows modeled after the PAW project to automate quality gates and releases.

## Work Breakdown

### Core Functionality

1. **PR Checks Workflow** (`pr-checks.yml`)
   - Triggered on PRs to `main` (and feature branches if applicable)
   - Path filtering: `src/**`, `agents/**`, `skills/**`, `cli/**`, `.github/workflows/**`
   - Steps:
     - Checkout, setup Node.js 20, cache npm dependencies
     - `npm run lint` — TypeScript linting
     - `npm run compile` — build extension
     - `xvfb-run -a npm test` — VS Code extension tests (headless)
     - `cd cli && npm test` — CLI tests
     - `npm run lint:agent:all` — agent/skill token linting

2. **Extension Release Workflow** (`release.yml`)
   - Triggered on `v*` tags (e.g., `v1.0.0`, `v0.3.0`)
   - Steps:
     - Extract version from tag, update package.json
     - Determine pre-release status (odd minor = pre-release)
     - Compile and package VSIX
     - Verify VSIX file exists
     - Check if GitHub Release already exists (skip if yes)
     - Create GitHub Release with VSIX attached
     - Publish to VS Code Marketplace (continue on failure, log warning)
   - Secrets required: `VSCE_PAT` (documented in workflow comments)

3. **CLI Publish Workflow** (`publish-cli.yml`)
   - Triggered on `cli-v*` tags (e.g., `cli-v1.0.0`)
   - Working directory: `cli/`
   - Steps:
     - Extract version from tag
     - Determine pre-release status (semver suffixes: -alpha, -beta, -rc)
     - Set package.json version from tag
     - Install dependencies, build, run tests
     - Verify dist/ contents are complete
     - Publish to npm with OIDC trusted publishing (provenance)
     - Check if GitHub Release exists (skip if yes)
     - Create GitHub Release
   - Authentication: npm OIDC (no token secret needed, requires npm package setup)

### Supporting Infrastructure

4. **Agent/Skill Linting Scripts**
   - Copy and adapt from PAW:
     - `scripts/lint-prompting.sh` — token size linter
     - `scripts/count-tokens.js` — tiktoken-based counter
   - Adapt for markdown-commenter paths and structure
   - Add `@dqbd/tiktoken` as devDependency
   - Add `lint:agent`, `lint:agent:all`, `lint:skills` npm scripts

5. **Documentation**
   - Inline comments in workflows explaining:
     - How to obtain and set `VSCE_PAT`
     - npm OIDC setup requirements
     - Branch protection recommendations
     - Pre-release versioning convention

## Edge Cases & Expected Handling

| Scenario | Handling |
|----------|----------|
| VS Code Marketplace upload fails | Continue workflow, log warning; GitHub Release still created with VSIX |
| VSIX packaging fails | Fail workflow entirely |
| CLI build produces incomplete dist/ | Fail workflow entirely |
| Missing changelog/release notes | Create release with placeholder text (user fills in later) |
| Same tag pushed twice | Skip release creation (idempotent) |
| package.json version ≠ tag | Tag is source of truth; workflow sets package.json version from tag |
| npm publish auth failure | Fail workflow (OIDC misconfiguration needs fixing) |
| Tag pushed from non-main branch | Use branch protection rules to prevent; document as requirement |

## Rough Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PR to main ─────────────────┐                              │
│                              ▼                              │
│                    ┌─────────────────┐                      │
│                    │   PR Checks     │                      │
│                    │  (pr-checks.yml)│                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                             ▼                               │
│              ┌──────────────────────────┐                   │
│              │ lint → compile → test    │                   │
│              │ extension + CLI + agents │                   │
│              └──────────────────────────┘                   │
│                                                             │
│  Push tag v* ────────────────┐                              │
│                              ▼                              │
│                    ┌─────────────────┐                      │
│                    │ Extension       │                      │
│                    │ Release         │                      │
│                    │ (release.yml)   │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                             ▼                               │
│              ┌──────────────────────────┐                   │
│              │ Build VSIX               │                   │
│              │         │                │                   │
│              │         ├─► GitHub       │                   │
│              │         │   Release      │                   │
│              │         │                │                   │
│              │         └─► VS Code      │                   │
│              │             Marketplace  │                   │
│              └──────────────────────────┘                   │
│                                                             │
│  Push tag cli-v* ────────────┐                              │
│                              ▼                              │
│                    ┌─────────────────┐                      │
│                    │ CLI Publish     │                      │
│                    │(publish-cli.yml)│                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                             ▼                               │
│              ┌──────────────────────────┐                   │
│              │ Build CLI                │                   │
│              │         │                │                   │
│              │         ├─► npm registry │                   │
│              │         │                │                   │
│              │         └─► GitHub       │                   │
│              │             Release      │                   │
│              └──────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Critical Analysis

### Value Assessment

**High value**: This automation eliminates manual release steps, ensures consistent quality gates, and aligns markdown-commenter with PAW's mature CI/CD practices. The one-time setup cost pays off quickly with every release.

### Build vs. Modify Tradeoffs

**Approach**: Model after PAW's existing workflows rather than starting from scratch.

**Why copy/adapt vs. reusable templates**:
- These two projects have similar but not identical structures
- Directly importing workflows would create tight coupling
- Copy-and-adapt allows project-specific customization while sharing patterns
- Future: Consider extracting reusable composite actions if more projects adopt this pattern

### Risks

1. **VSCE_PAT expiration**: Personal Access Tokens expire; document renewal process
2. **npm OIDC setup**: Requires npm package configuration; document prerequisites
3. **tiktoken dependency**: External dependency for token counting; pin version
4. **Branch protection overhead**: May slow down emergency hotfixes; document bypass procedure

## Codebase Fit

### Similar Features in PAW

- `/.github/workflows/pr-checks.yml` — quality gate workflow
- `/.github/workflows/release.yml` — VSIX release workflow
- `/.github/workflows/publish-cli.yml` — npm publish workflow
- `/scripts/lint-prompting.sh` — agent/skill linting
- `/scripts/count-tokens.js` — token counting utility

### Reuse Opportunities

| PAW File | Reuse Strategy |
|----------|----------------|
| `pr-checks.yml` | Copy, adapt paths and job names |
| `release.yml` | Copy, add Marketplace publish step, adapt package name |
| `publish-cli.yml` | Copy, adapt package name and scope |
| `lint-prompting.sh` | Copy as-is (generic enough) |
| `count-tokens.js` | Copy, remove PAW-specific template expansion if not needed |

## Risk Assessment

### Potential Negative Impacts

1. **Failed releases leave orphaned tags**: Document tag cleanup procedure
2. **Marketplace publish failures could delay user access**: Mitigated by always creating GitHub Release first
3. **Token linting may block legitimate large agents**: Thresholds are warnings first, errors only at extreme sizes

### Gotchas

- **npm OIDC requires package.json `publishConfig`**: Document in workflow
- **VS Code extension tests need `xvfb`**: Already handled in PAW's PR checks
- **CLI working directory**: Workflows must use `working-directory: cli`
- **Package names differ**: markdown-commenter vs paw-workflow in VSIX filenames

## Open Questions for Downstream Stages

1. **Marketplace publisher ID**: Is `erdem-tuna` the correct publisher for VS Code Marketplace?
2. **npm package scope**: Confirm `@erdem-tuna/markdown-commenter` is the intended npm scope
3. **Token thresholds**: Use PAW's defaults (5K warn, 7K error for agents; 8K/12K for skills)?
4. **Should CLI tests run as part of PR checks?**: Currently planned as yes
5. **MkDocs workflow**: PAW has `docs.yml` for documentation — needed for markdown-commenter?

## Session Notes

### Key Decisions

- **Tag-triggered releases**: Matches PAW pattern, allows deliberate releases
- **Separate tag patterns**: `v*` for extension, `cli-v*` for CLI (independent versioning)
- **Even/odd minor versioning**: Aligns with VS Code extension pre-release convention
- **OIDC over access tokens**: More secure npm authentication
- **Skip Marketplace on failure**: Resilience over strict consistency; GitHub Release is primary

### Rejected Alternatives

- **Reusable workflow templates**: Rejected in favor of copy/adapt for project independence
- **Auto-release on PR merge**: Rejected; tag-triggered gives more control
- **Single tag for both artifacts**: Rejected; independent versioning is more flexible
- **Access token for npm**: Rejected; OIDC is best practice

### Surprising Discoveries

- PAW already has comprehensive workflows that can serve as templates
- markdown-commenter's CLI structure closely mirrors PAW's CLI structure
- Agent linting infrastructure (tiktoken) requires a devDependency addition
