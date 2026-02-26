# Markdown Commenter CLI

CLI installer for the Markdown Commenter Copilot skill and agent.

## Installation

Install to GitHub Copilot CLI:

```bash
npx @erdemtuna/markdown-commenter install copilot
```

This installs:
- Agent: `~/.copilot/agents/Annotate.agent.md`
- Skill: `~/.copilot/skills/annotate/SKILL.md`

## Usage

After installation, the annotation agent is available in Copilot CLI:

```bash
# Start annotation workflow
@annotate path/to/document.md

# Get help
@annotate help
```

## Commands

### install

Install skill and agent to target platform:

```bash
markdown-commenter install copilot
```

### uninstall

Remove installed skill and agent:

```bash
markdown-commenter uninstall
```

### list

Show current installation info:

```bash
markdown-commenter list
```

## What Gets Installed

| File | Location |
|------|----------|
| `Annotate.agent.md` | `~/.copilot/agents/` |
| `SKILL.md` | `~/.copilot/skills/annotate/` |

## VS Code Users

If you use VS Code, install the [Markdown Commenter extension](https://marketplace.visualstudio.com/items?itemName=erdem-tuna.markdown-commenter) instead. It provides the same functionality through VS Code's Copilot Chat.

## License

MIT
