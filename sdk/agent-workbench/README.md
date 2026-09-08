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

The Result panel follows the cookbook's existing field-name redaction convention:
JSON fields whose names contain `token`, `password`, `secret`, or `authorization`,
or end in `key`, are masked case-insensitively. This also masks non-secret fields
such as `tokenCount`; it does not detect secrets in other fields or inside text.
Session controls and streamed assistant text remain visible, so this does not
sanitize an entire screenshot or recording.
