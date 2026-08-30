import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { redactSensitiveOutput } from "../recipes/_shared/run-main.js";
import { redactSensitiveOutput as codingAgentRedact } from "../sdk/coding-agent-cli/src/redact-sensitive-output.js";
import { redactSensitiveOutput as quickstartRedact } from "../sdk/quickstart/src/redact-sensitive-output.js";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const LEAKED_SESSION_KEY = "leaked-session-key-f002";

async function runStarter(filter: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(
    "pnpm",
    ["--filter", filter, "exec", "tsx", "src/index.ts", ...args],
    {
      cwd: repoRoot,
      env: { ...process.env, OPENCLAW_SESSION_KEY: LEAKED_SESSION_KEY },
      timeout: 20_000,
    },
  );
  return stdout;
}

const SAMPLE = {
  sessionKey: "cookbook-demo",
  nested: { token: "abc123", password: "s3cret", authorization: "Bearer x", ok: true },
  raw: { apiKey: "sk-live", count: 1 },
};

describe("SDK starter CLI JSON output", () => {
  it("keeps starter helpers aligned with the recipe redactor", () => {
    expect(codingAgentRedact(SAMPLE)).toEqual(redactSensitiveOutput(SAMPLE));
    expect(quickstartRedact(SAMPLE)).toEqual(redactSensitiveOutput(SAMPLE));
    expect(codingAgentRedact(SAMPLE)).toEqual({
      sessionKey: "[REDACTED]",
      nested: {
        token: "[REDACTED]",
        password: "[REDACTED]",
        authorization: "[REDACTED]",
        ok: true,
      },
      raw: { apiKey: "[REDACTED]", count: 1 },
    });
  });

  it("redacts sessionKey from coding-agent-cli run JSON", async () => {
    const stdout = await runStarter("@openclaw/cookbook-coding-agent-cli", ["Cookbook smoke"]);

    expect(stdout).toMatch(/"sessionKey": "\[REDACTED\]"/);
    expect(stdout).not.toContain(LEAKED_SESSION_KEY);
  });

  it("redacts sessionKey from quickstart run JSON", async () => {
    const stdout = await runStarter("@openclaw/cookbook-quickstart", ["Cookbook smoke"]);

    expect(stdout).toMatch(/"sessionKey": "\[REDACTED\]"/);
    expect(stdout).not.toContain(LEAKED_SESSION_KEY);
  });
});
