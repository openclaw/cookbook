# Stream Events

Start a run and iterate normalized SDK events until the run reaches a terminal
state.

```bash
pnpm recipe:stream-events -- "Refactor the current branch and explain the diff"
```

The SDK keeps provider-native payloads in `event.raw`, while `event.type` gives
apps a stable UI contract such as `run.started`, `assistant.delta`, or
`run.completed`.
