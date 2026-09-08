import { describe, expect, it } from "vitest";
import { OpenClaw } from "@openclaw/sdk";
import { redactSensitiveOutput } from "../recipes/_shared/run-main.js";
import { formatRunResultJson } from "../sdk/agent-workbench/src/format-run-result-json.js";
import { redactSensitiveOutput as workbenchRedact } from "../sdk/agent-workbench/src/redact-sensitive-output.js";

const LEAKED_SESSION_KEY = "leaked-session-key-f003";
const LEAKED_TOKEN = "tok-live-f003";
const LEAKED_PASSWORD = "p@ss-f003";

const SAMPLE = {
  runId: "run_workbench",
  status: "completed",
  sessionKey: LEAKED_SESSION_KEY,
  token: LEAKED_TOKEN,
  password: LEAKED_PASSWORD,
  raw: { apiKey: "sk-live-f003", count: 1 },
};

describe("agent workbench result JSON", () => {
  it("keeps the workbench helper aligned with the recipe redactor", () => {
    expect(workbenchRedact(SAMPLE)).toEqual(redactSensitiveOutput(SAMPLE));
  });

  it("omits sessionKey, token, and password from rendered result JSON", () => {
    const json = formatRunResultJson(SAMPLE);

    expect(json).toMatch(/"sessionKey": "\[REDACTED\]"/);
    expect(json).toMatch(/"token": "\[REDACTED\]"/);
    expect(json).toMatch(/"password": "\[REDACTED\]"/);
    expect(json).not.toContain(LEAKED_SESSION_KEY);
    expect(json).not.toContain(LEAKED_TOKEN);
    expect(json).not.toContain(LEAKED_PASSWORD);
    expect(json).not.toContain("sk-live-f003");
  });

  it("redacts sessionKey from a workbench wait() result", async () => {
    const oc = new OpenClaw();
    const run = await oc.runs.create({
      input: "Cookbook smoke",
      sessionKey: LEAKED_SESSION_KEY,
    });
    for await (const event of run.events()) {
      if (
        event.type === "run.completed" ||
        event.type === "run.failed" ||
        event.type === "run.cancelled" ||
        event.type === "run.timed_out"
      ) {
        break;
      }
    }
    const json = formatRunResultJson(await run.wait());
    await oc.close();

    expect(json).toMatch(/"sessionKey": "\[REDACTED\]"/);
    expect(json).not.toContain(LEAKED_SESSION_KEY);
  });
});
