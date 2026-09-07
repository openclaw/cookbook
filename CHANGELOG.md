# Changelog

## Unreleased

**Highlights:** Six runnable SDK recipes and four copyable starter apps, with responsive terminal cancellation and sensitive-field redaction in CLI JSON output.

- Add standalone Quickstart, Coding Agent CLI, Agent Workbench, and Run Board examples for terminal apps, agent control, and run monitoring.
- Add focused recipes for starting runs, streaming events, cancelling work, reusing sessions, checking models, and using an in-memory transport.
- Keep the coding-agent CLI responsive for cancellation, including startup, retry, terminal shutdown, and symlinked entrypoints; thanks @SebTardif.
- Redact sensitive fields from Quickstart and Coding Agent CLI result, status, and cancellation JSON; thanks @SebTardif.
- Redact credential-like fields from recipe and Node CLI wrapper output.
- Build the workspace SDK shim so compiled standalone examples run locally before the SDK package is published.
- Add a Node CLI recipe wrapper, recipe manifests, contribution guidance, and checks for documentation and all starter examples.
- Use canonical public model identifiers in SDK shim and Run Board fixtures.
- Refresh starter icons, TypeScript tooling and types, formatter, linter, test runner, and React/Vite dependencies, including Vite and esbuild security updates.
- Pin pnpm 10.34.5 and enforce a two-day minimum dependency release age across the workspace.
