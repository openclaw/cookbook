# Contributing

Cookbook recipes should be small, runnable, and copyable.

## Recipe Rules

- Put each recipe in `recipes/<id>/`.
- Include `README.md` and `index.ts`.
- Add the recipe to `recipes/manifest.json`.
- Import the SDK as `@openclaw/sdk`, not from OpenClaw monorepo internals.
- Keep recipe code focused on one SDK concept.
- Prefer environment variables for Gateway configuration.
- Add or update tests in `test/recipes.test.ts`.

## Checks

Run the full gate before opening a PR:

```bash
pnpm check
```

Until `@openclaw/sdk` is published, tests use `test/shims/openclaw-sdk.ts`.
That shim is only a local validation aid; recipe source should still reflect the
real public SDK API.

Standalone examples live under `sdk/<name>`. Each example should have its own
`package.json`, `README.md`, `tsconfig.json`, and `check` script. Add new
examples to the root README and `scripts/check-docs.mjs`.
