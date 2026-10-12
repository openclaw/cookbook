import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
for (const file of [
  "sdk/quickstart/package.json",
  "sdk/coding-agent-cli/package.json",
  "sdk/agent-workbench/package.json",
  "sdk/run-board/package.json",
]) {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(manifest.version, version, `${file} must match release version ${version}`);
  assert.equal(manifest.private, true, `${file} must remain private`);
}
console.log(`Workspace release versions match ${version}`);
