# Run an Agent

Start a run, wait for the Gateway to return a terminal result, and print the
stable SDK result envelope.

```bash
OPENCLAW_AGENT_ID=main pnpm recipe:run-agent -- "Summarize this repository"
```

Use this when you want the simplest request/response shape. For live progress,
use [`stream-events`](../stream-events).
