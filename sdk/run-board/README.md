# Run Board

A dashboard-style example for tracking agent runs by state, model, session, and
recent activity.

It demonstrates how a product can turn SDK events and results into an operator
view rather than a chat transcript.

## Getting Started

```bash
pnpm install
pnpm dev
```

The cookbook shim seeds sample runs during CI. With the published SDK, replace
the sample loader with Gateway-backed run/session/task queries.
