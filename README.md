# Markdown Commenter

Markdown annotation for VS Code and Copilot CLI.

## Features

- **AI-Powered Review**: Copilot identifies reviewable items in your markdown documents
- **Interactive Workflow**: Walk through each item, make decisions with Accept/Reject/Skip/Question verdicts
- **Structured Annotations**: Verdicts recorded as GitHub-style `> [!COMMENT]` callout blocks
- **Dual Distribution**: Works in VS Code (extension) and terminal (Copilot CLI)
- **Resume Support**: Pick up where you left off — already-annotated items are skipped

### VS Code UI Components

The extension provides rich UI for manual annotation without AI:

- **Quick-pick Command** (`Ctrl+Shift+A` / `Cmd+Shift+A`) — Select text, choose status, add optional comment
- **Hover UI** — Select text and hover to see clickable status buttons (`✓ Accept`, `✗ Reject`, etc.)
- **CodeLens** — Status indicators appear above each annotation block; click to navigate
- **Sidebar Panel** — Lists all annotations in the current file; click to jump to location
- **Status Bar** — Shows annotation count; click to reveal sidebar panel
- **Context Menu** — Right-click selected text → "Add Annotation"

## Installation

### VS Code Extension

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=erdem-tuna.markdown-commenter):

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Markdown Commenter"
4. Click Install

Or install via command line:
```bash
code --install-extension erdem-tuna.markdown-commenter
```

### Copilot CLI

For terminal users with GitHub Copilot CLI:

```bash
npx @erdem-tuna/markdown-commenter install copilot
```

This installs the annotation agent and skill to `~/.copilot/`.

## Quick Start

### VS Code

1. Open a markdown file containing findings or recommendations
2. Open Copilot Chat (Ctrl+Shift+I or click the Copilot icon)
3. Say: "Annotate this document" or "@annotate help"
4. Follow the interactive workflow to review each item

### Copilot CLI

1. In your terminal, start the annotation:
   ```bash
   @annotate path/to/document.md
   ```
2. Review each item as presented
3. Enter your verdict: Accept, Reject, Skip, or Question

## Annotation Format

Annotations are written as GitHub-style callout blocks:

```markdown
> [!COMMENT]
> **ID**: abc12345
> **Status**: Accept
> **Re**: "key finding text..." (optional)
>
> Your comment explaining the verdict.
```

### Verdict Types

| Verdict | Meaning |
|---------|---------|
| **Accept** | Agree with the item |
| **Reject** | Disagree or identify an issue |
| **Skip** | Not relevant or defer for later |
| **Question** | Need clarification before deciding |

## Configuration

### VS Code Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `markdown-commenter.promptsDirectory` | Custom agent installation directory | Platform default |

Platform defaults:
- **Linux**: `~/.config/Code/User/prompts/`
- **macOS**: `~/Library/Application Support/Code/User/prompts/`
- **Windows**: `%APPDATA%/Code/User/prompts/`

## Use Cases

- **Document Reviews**: Annotate audit reports, technical assessments, compliance documents
- **Feedback Sessions**: Review proposals, specs, or design documents with structured comments
- **Meeting Notes**: Process action items and decisions with clear verdicts
- **Research Papers**: Annotate findings and recommendations for later reference

## Troubleshooting

### Agent not appearing in Copilot Chat

1. Reload VS Code window (Ctrl+Shift+P → "Reload Window")
2. Check output channel: View → Output → "Markdown Commenter"
3. Verify agent is installed: Check `~/.config/Code/User/prompts/` (Linux)

### CLI installation issues

1. Verify Node.js 18+: `node --version`
2. Check installation: `npx @erdem-tuna/markdown-commenter list`
3. Reinstall: `npx @erdem-tuna/markdown-commenter uninstall && npx @erdem-tuna/markdown-commenter install copilot`

## Development

### Build from source

```bash
git clone https://github.com/erdem-tuna/markdown-commenter
cd markdown-commenter
npm install
npm run compile
```

### Run tests

```bash
npm test                   # Extension tests
cd cli && npm test         # CLI tests
```

### Lint agent files

```bash
npm run lint:agent:all     # Lint agents and skills for token limits
```

### Package extension

```bash
npm run package
```

### Release process

Releases are automated via GitHub Actions:

- **Extension**: Push a `v*` tag (e.g., `git tag v1.0.0 && git push origin v1.0.0`)
- **CLI**: Push a `cli-v*` tag (e.g., `git tag cli-v1.0.0 && git push origin cli-v1.0.0`)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See the [Code of Conduct](CODE_OF_CONDUCT.md) for community guidelines.

## License

[MIT](LICENSE)

## Related

- [GitHub Copilot](https://github.com/features/copilot)
- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
