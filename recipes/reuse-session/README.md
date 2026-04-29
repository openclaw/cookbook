# Reuse a Session

Create or reuse a session key, send two messages, and wait for both run results.

```bash
OPENCLAW_SESSION_KEY=cookbook-demo pnpm recipe:reuse-session
```

Use this pattern for chat UIs, background workflows, and any app that wants a
stable thread rather than one-off runs.
