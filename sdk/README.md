# SDK Examples

Standalone examples follow the same ladder as the public SDK adoption path:

1. `quickstart` for the smallest complete run.
2. `coding-agent-cli` for a practical terminal workflow.
3. `agent-workbench` for a product-style chat/run surface.
4. `run-board` for an operator dashboard.

Each example has its own `package.json` and can be copied out of the cookbook.
During cookbook CI, examples depend on the local `@openclaw/sdk` shim workspace
package. After the SDK is published, replace `workspace:*` with the published
version range.
