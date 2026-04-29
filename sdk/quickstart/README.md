# OpenClaw SDK Quickstart

A minimal Node.js example that creates one agent run, streams normalized events
to stdout, and waits for the final result.

## Getting Started

Use Node.js 22 or newer.

```bash
pnpm install
export OPENCLAW_GATEWAY=auto
pnpm dev
```

Build and run the compiled example:

```bash
pnpm build
pnpm start
```

## Notes

Set `OPENCLAW_AGENT_ID`, `OPENCLAW_SESSION_KEY`, or `OPENCLAW_MODEL` to override
the defaults.
