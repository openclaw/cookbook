# Coding Agent CLI

A small terminal app for running OpenClaw agents from a workspace.

One-shot prompts run immediately. If you omit the prompt, the CLI enters an
interactive shell with slash commands for model selection, session switching,
status, cancellation, and exit.

## Getting Started

```bash
pnpm install
export OPENCLAW_GATEWAY=auto
pnpm dev "Explain this project"
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
- `/cancel` cancels the active run. Type it while events are still streaming.
- Ctrl+C also cancels the active run. A second Ctrl+C exits when idle.
- `/exit` exits.

Cancellation requested during startup waits for the run handle. If cancellation
fails, the CLI reports the error and stays available for another `/cancel` or
`/exit`. Ctrl+C cancels while a run is active and exits when idle. Closing input
also attempts cancellation before closing the SDK client.

Structured JSON output masks session keys and credential-like fields, matching the
cookbook recipes. Streamed assistant text remains verbatim.
