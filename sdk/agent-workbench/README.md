# Agent Workbench

A local web app for driving an OpenClaw agent run from a compact control room.

It demonstrates:

- Gateway connection settings,
- prompt and model controls,
- normalized event streaming,
- cancellation,
- final result display,
- session reuse.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open the Vite URL and run the demo. The cookbook shim makes the app work during
local CI; once `@openclaw/sdk` is published, the same UI can point at a real
Gateway.
