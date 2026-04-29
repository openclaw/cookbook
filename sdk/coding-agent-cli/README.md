# Coding Agent CLI

A small terminal app for running OpenClaw agents from a workspace.

One-shot prompts run immediately. If you omit the prompt, the CLI enters an
interactive shell with slash commands for model selection, session switching,
status, cancellation, and exit.

## Getting Started

```bash
pnpm install
export OPENCLAW_GATEWAY=auto
pnpm dev -- "Explain this project"
```

Start interactive mode:

```bash
pnpm dev
```

## Slash Commands

- `/help` prints commands.
- `/model <model>` sets a model override for future runs.
- `/session <key>` switches the session key.
- `/status` prints Gateway model/auth status.
- `/cancel` cancels the active run.
- `/exit` exits.
