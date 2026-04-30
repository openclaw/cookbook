# OpenClaw Cookbook

Runnable examples for building apps, tools, and automations on the OpenClaw SDK.

This repository is the copyable companion to the public SDK. It is organized as
two layers:

- `recipes/`: small, one-concept TypeScript examples that show a single SDK
  workflow.
- `sdk/`: standalone starter apps that can be copied out and turned into real
  products.

Use the cookbook when you want to see the SDK in context: starting runs,
streaming events, cancelling work, reusing sessions, checking model status, and
testing app code without a live Gateway.

## Status

The SDK package is landing in `openclaw/openclaw` first. Until `@openclaw/sdk`
is published, this repo uses a private workspace shim named `@openclaw/sdk` so
CI can typecheck, test, and build every example without reaching into OpenClaw
monorepo internals.

Recipe and example source imports `@openclaw/sdk` directly. That keeps copied
code aligned with the real package shape once the SDK is published.

## Quick Start

Install dependencies and run the full cookbook gate:

```bash
pnpm install
pnpm check
```

Run the smallest local recipe:

```bash
pnpm recipe:custom-transport -- "test prompt"
```

That recipe uses an in-memory transport, so it does not require a running
Gateway.

## Connect To A Gateway

Recipes that talk to OpenClaw need a Gateway URL or local discovery. Once the
published SDK is available in your app, install it and point the example at your
Gateway:

```bash
pnpm add @openclaw/sdk
export OPENCLAW_GATEWAY=auto
export OPENCLAW_AGENT_ID=main
pnpm recipe:run-agent -- "Summarize this repository"
```

Use explicit credentials for protected Gateways:

```bash
export OPENCLAW_GATEWAY=ws://127.0.0.1:1455
export OPENCLAW_TOKEN=...
```

### Environment Variables

| Name                          | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `OPENCLAW_GATEWAY`            | Gateway URL, or `auto` for local discovery.                         |
| `OPENCLAW_TOKEN`              | Bearer token for protected Gateways.                                |
| `OPENCLAW_PASSWORD`           | Password for protected Gateways.                                    |
| `OPENCLAW_AGENT_ID`           | Agent id used by recipes. Defaults to `main`.                       |
| `OPENCLAW_SESSION_KEY`        | Session key for recipes that reuse a conversation.                  |
| `OPENCLAW_MODEL`              | Optional model override, such as `openrouter/deepseek/deepseek-r1`. |
| `OPENCLAW_CANCEL_AFTER_MS`    | Delay before the cancellation recipe calls `run.cancel()`.          |
| `OPENCLAW_MODEL_STATUS_PROBE` | Set to `1` to let the model-status recipe request provider probes.  |

## Choose An Example

Start with the smallest thing that matches your product shape:

| Goal                                  | Start Here                                             | Why                                                   |
| ------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Send one prompt and wait for a result | [`recipes/run-an-agent`](recipes/run-an-agent)         | Minimal request/response flow.                        |
| Show live progress in a UI            | [`recipes/stream-events`](recipes/stream-events)       | Normalized event iteration with stable event types.   |
| Add a stop button or time budget      | [`recipes/cancel-a-run`](recipes/cancel-a-run)         | First-class cancellation by run id.                   |
| Build a chat thread                   | [`recipes/reuse-session`](recipes/reuse-session)       | Stable session keys across turns.                     |
| Show provider/auth readiness          | [`recipes/model-status`](recipes/model-status)         | Gateway model status and optional probes.             |
| Test without a Gateway                | [`recipes/custom-transport`](recipes/custom-transport) | In-memory transport boundary for app tests.           |
| Build a terminal app                  | [`sdk/coding-agent-cli`](sdk/coding-agent-cli)         | One-shot prompts plus interactive slash commands.     |
| Build a web control surface           | [`sdk/agent-workbench`](sdk/agent-workbench)           | Prompt, model, session, event, cancel, and result UI. |
| Build an operations dashboard         | [`sdk/run-board`](sdk/run-board)                       | Run grouping by status, model, session, and activity. |

## Recipes

| Recipe                                         | Command                                                                    | What It Shows                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`run-an-agent`](recipes/run-an-agent)         | `pnpm recipe:run-agent -- "Summarize this repository"`                     | Start a run and wait for a stable SDK result envelope. |
| [`stream-events`](recipes/stream-events)       | `pnpm recipe:stream-events -- "Explain this branch"`                       | Subscribe to normalized SDK events for a run.          |
| [`cancel-a-run`](recipes/cancel-a-run)         | `OPENCLAW_CANCEL_AFTER_MS=1500 pnpm recipe:cancel-a-run -- "Keep working"` | Cancel active work by run id.                          |
| [`reuse-session`](recipes/reuse-session)       | `OPENCLAW_SESSION_KEY=cookbook-demo pnpm recipe:reuse-session`             | Create or reuse a session across multiple messages.    |
| [`model-status`](recipes/model-status)         | `pnpm recipe:model-status`                                                 | Check configured model providers and auth status.      |
| [`custom-transport`](recipes/custom-transport) | `pnpm recipe:custom-transport -- "test prompt"`                            | Test SDK code with an in-memory transport.             |

The recipe manifest lives at [`recipes/manifest.json`](recipes/manifest.json).

## SDK Examples

| Example                                    | Type      | What It Demonstrates                                                |
| ------------------------------------------ | --------- | ------------------------------------------------------------------- |
| [`quickstart`](sdk/quickstart)             | Node app  | The smallest complete run, stream, wait flow.                       |
| [`coding-agent-cli`](sdk/coding-agent-cli) | CLI app   | One-shot and interactive terminal agent workflows.                  |
| [`agent-workbench`](sdk/agent-workbench)   | React app | A compact control room for runs, events, cancellation, and results. |
| [`run-board`](sdk/run-board)               | React app | Dashboard-style operator view grouped by run status.                |

Each SDK example has its own `package.json`, `README.md`, `tsconfig.json`, and
`check` script. You can copy one directory into another repository and replace
the workspace SDK dependency with the published `@openclaw/sdk` version.

## Recipe Wrapper Example

[`examples/node-cli`](examples/node-cli) is a small command-line wrapper around
the core recipes:

```bash
pnpm example:node-cli run "Say hello"
pnpm example:node-cli stream "Explain this branch"
pnpm example:node-cli models
pnpm example:node-cli session
```

In a real app, keep recipe logic in small library functions and keep the CLI
responsible for argument parsing, output formatting, and exit codes.

## Development

The root gate matches CI:

```bash
pnpm check
```

Individual checks:

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm docs:check
pnpm examples:check
```

Useful targeted commands:

```bash
pnpm recipe:run-agent -- "Summarize this repository"
pnpm --filter @openclaw/cookbook-quickstart check
pnpm --filter @openclaw/cookbook-agent-workbench dev
```

## Adding Examples

Recipes should be small, runnable, and copyable:

1. Add `recipes/<id>/README.md`.
2. Add `recipes/<id>/index.ts`.
3. Register it in [`recipes/manifest.json`](recipes/manifest.json).
4. Add or update coverage in [`test/recipes.test.ts`](test/recipes.test.ts).
5. Run `pnpm check`.

Standalone SDK examples live under `sdk/<name>`. Include a local README,
`package.json`, `tsconfig.json`, and a `check` script, then add the example to
this README and [`scripts/check-docs.mjs`](scripts/check-docs.mjs).

## License

MIT. See [`LICENSE`](LICENSE).
