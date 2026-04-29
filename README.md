# OpenClaw Cookbook

Runnable examples for building on the OpenClaw SDK.

This repository is the public, copyable companion to the SDK. It has two layers:
small recipes that fit in one file, and standalone SDK examples that can be
copied out as apps.

## Status

The SDK package is landing in `openclaw/openclaw` first. Until `@openclaw/sdk`
is published, this repo keeps a local workspace shim so CI can validate recipe
and example shape without depending on a live Gateway or unpublished package.

## Quick Start

```bash
pnpm install
pnpm check
```

To run a recipe against a real Gateway, install the SDK once it is published and
set the Gateway connection details:

```bash
pnpm add @openclaw/sdk
export OPENCLAW_GATEWAY=auto
export OPENCLAW_AGENT_ID=main
pnpm recipe:run-agent -- "Summarize this repository"
```

Useful environment variables:

| Name                   | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `OPENCLAW_GATEWAY`     | Gateway URL, or `auto` for local discovery.                         |
| `OPENCLAW_TOKEN`       | Bearer token for protected Gateways.                                |
| `OPENCLAW_PASSWORD`    | Password for protected Gateways.                                    |
| `OPENCLAW_AGENT_ID`    | Agent id used by recipes. Defaults to `main`.                       |
| `OPENCLAW_SESSION_KEY` | Session key for recipes that reuse a conversation.                  |
| `OPENCLAW_MODEL`       | Optional model override, such as `openrouter/deepseek/deepseek-r1`. |

## Recipes

| Recipe                                         | What it shows                                       |
| ---------------------------------------------- | --------------------------------------------------- |
| [`run-an-agent`](recipes/run-an-agent)         | Start a run and wait for a stable result envelope.  |
| [`stream-events`](recipes/stream-events)       | Subscribe to normalized SDK events for a run.       |
| [`cancel-a-run`](recipes/cancel-a-run)         | Cancel active work by run id.                       |
| [`reuse-session`](recipes/reuse-session)       | Create or reuse a session across multiple messages. |
| [`model-status`](recipes/model-status)         | Check configured model providers and auth status.   |
| [`custom-transport`](recipes/custom-transport) | Test SDK code with an in-memory transport.          |

## SDK Examples

| Example                                    | What it is                                                    |
| ------------------------------------------ | ------------------------------------------------------------- |
| [`quickstart`](sdk/quickstart)             | The smallest complete run, stream, wait flow.                 |
| [`coding-agent-cli`](sdk/coding-agent-cli) | One-shot and interactive terminal agent with slash commands.  |
| [`agent-workbench`](sdk/agent-workbench)   | Web control room for runs, events, cancellation, and results. |
| [`run-board`](sdk/run-board)               | Dashboard-style operator view grouped by run status.          |

## Recipe Wrapper Example

| Example                         | What it is                                            |
| ------------------------------- | ----------------------------------------------------- |
| [`node-cli`](examples/node-cli) | A small command-line app that wraps the core recipes. |

## Repository Scripts

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm docs:check
pnpm examples:check
pnpm check
```

The workspace includes a local private package named `@openclaw/sdk` so CI can
validate examples before the SDK is published. Recipe and example source imports
`@openclaw/sdk` directly so copied code matches real SDK usage.
