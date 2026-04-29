import { describe, expect, it } from "vitest";
import { cancelRunRecipe } from "../recipes/cancel-a-run/index.js";
import { customTransportRecipe } from "../recipes/custom-transport/index.js";
import { modelStatusRecipe } from "../recipes/model-status/index.js";
import { reuseSessionRecipe } from "../recipes/reuse-session/index.js";
import { runAgentRecipe } from "../recipes/run-an-agent/index.js";
import { streamEventsRecipe } from "../recipes/stream-events/index.js";

describe("cookbook recipes", () => {
  it("runs an agent and returns a completed result", async () => {
    await expect(runAgentRecipe({ input: "hello" })).resolves.toMatchObject({
      runId: "cookbook-run",
      status: "completed",
    });
  });

  it("streams normalized events through a terminal event", async () => {
    await expect(streamEventsRecipe({ input: "stream" })).resolves.toEqual([
      { type: "run.started", runId: "cookbook-run" },
      { type: "assistant.delta", runId: "cookbook-run" },
      { type: "run.completed", runId: "cookbook-run" },
    ]);
  });

  it("cancels a run", async () => {
    await expect(cancelRunRecipe({ input: "cancel", cancelAfterMs: 0 })).resolves.toMatchObject({
      runId: "cookbook-run",
      cancelResponse: { ok: true, status: "aborted" },
      result: { status: "completed" },
    });
  });

  it("reuses a session for multiple messages", async () => {
    const result = await reuseSessionRecipe({ sessionKey: "recipe-test" });

    expect(result.sessionKey).toBe("recipe-test");
    expect(result.results).toHaveLength(2);
    expect(result.results.every((entry) => entry.status === "completed")).toBe(true);
  });

  it("reads model status", async () => {
    await expect(modelStatusRecipe()).resolves.toMatchObject({
      providers: [{ id: "openai", authenticated: true }],
    });
  });

  it("runs against a custom transport", async () => {
    const result = await customTransportRecipe("transport");

    expect(result.runId).toBe("cookbook-run");
    expect(result.calls.map((call) => call.method)).toEqual(["agent", "agent.wait"]);
  });
});
