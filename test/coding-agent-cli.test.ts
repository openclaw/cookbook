import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { OpenClaw, type OpenClawEvent, type Run, type RunResult } from "@openclaw/sdk";
import { runCodingAgentCli } from "../sdk/coding-agent-cli/src/index.js";

class HangingRun {
  readonly id = "hanging-run";
  private cancelled = false;
  private holdWaiters: Array<() => void> = [];

  async *events(): AsyncIterable<OpenClawEvent> {
    yield {
      version: 1,
      id: "start",
      ts: Date.now(),
      type: "run.started",
      runId: this.id,
      data: {},
    };
    if (!this.cancelled) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 400);
        this.holdWaiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    yield {
      version: 1,
      id: this.cancelled ? "cancelled" : "end",
      ts: Date.now(),
      type: this.cancelled ? "run.cancelled" : "run.completed",
      runId: this.id,
      data: {},
    };
  }

  async wait(): Promise<RunResult> {
    return {
      runId: this.id,
      status: this.cancelled ? "cancelled" : "completed",
      endedAt: 456,
    };
  }

  async cancel(): Promise<unknown> {
    this.cancelled = true;
    for (const wake of this.holdWaiters) {
      wake();
    }
    this.holdWaiters = [];
    return { ok: true, status: "aborted", abortedRunId: this.id };
  }
}

function hangingClient(): OpenClaw {
  const run = new HangingRun();
  const oc = new OpenClaw();
  oc.runs.create = async () => run as unknown as Run;
  return oc;
}

async function waitFor(
  read: () => string,
  match: string | ((text: string) => boolean),
  timeoutMs = 2000,
): Promise<string> {
  const start = Date.now();
  const hit = typeof match === "string" ? (text: string) => text.includes(match) : match;
  for (;;) {
    const text = read();
    if (hit(text)) {
      return text;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for output.\n${text}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("coding-agent-cli", () => {
  it("cancels the active run when /cancel is typed during sendPrompt", async () => {
    const input = new PassThrough();
    const chunks: string[] = [];
    const output = new PassThrough();
    output.on("data", (chunk: Buffer | string) => {
      chunks.push(String(chunk));
    });
    const read = () => chunks.join("");

    const done = runCodingAgentCli({ argv: [], input, output, client: hangingClient() });
    try {
      await waitFor(read, "openclaw>");
      input.write("keep working\n");
      await waitFor(read, "[run.started]");
      input.write("/cancel\n");
      const text = await waitFor(
        read,
        (current) => current.includes("aborted") || current.includes("No active run."),
      );
      expect(text).toContain("aborted");
      expect(text).not.toContain("No active run.");
    } finally {
      input.write("/exit\n");
      input.end();
      await done;
    }
  });
});
