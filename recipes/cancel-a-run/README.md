# Cancel a Run

Start a run, cancel it by `runId`, then wait for the Gateway result. This is the
shape to use for UI stop buttons and automation time budgets.

```bash
OPENCLAW_CANCEL_AFTER_MS=1500 pnpm recipe:cancel-a-run -- "Keep working until cancelled"
```

The SDK cancellation path does not require callers to know the session key when
the Gateway can resolve the active run by id.
