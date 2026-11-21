// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../sdk/agent-workbench/src/App.js";

const sdk = vi.hoisted(() => ({ create: vi.fn(), close: vi.fn(), construct: vi.fn() }));
vi.mock("@openclaw/sdk", () => ({
  OpenClaw: class {
    constructor() {
      sdk.construct();
    }
    runs = { create: sdk.create };
    close = sdk.close;
  },
}));

let root: Root;
let container: HTMLDivElement;
const failure = new Error("private-provider-token must not be displayed");

function successfulRun() {
  return {
    cancel: vi.fn(),
    events: async function* () {
      yield { type: "run.completed", runId: "synthetic-run", data: {} };
    },
    wait: vi.fn().mockResolvedValue({ runId: "synthetic-run", status: "completed", text: "Done" }),
  };
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  sdk.create.mockReset().mockResolvedValue(successfulRun());
  sdk.close.mockReset().mockResolvedValue(undefined);
  sdk.construct.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(App)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function submit() {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("Workbench run request failures", () => {
  it.each(["constructor", "create", "events", "wait", "close"])(
    "shows a safe alert and enables retry after %s rejects",
    async (phase) => {
      const run = successfulRun();
      sdk.create.mockResolvedValue(run);
      if (phase === "constructor")
        sdk.construct.mockImplementationOnce(() => {
          throw failure;
        });
      if (phase === "create") sdk.create.mockRejectedValueOnce(failure);
      if (phase === "events")
        run.events = async function* () {
          yield { type: "run.started", runId: "synthetic-run", data: {} };
          throw failure;
        };
      if (phase === "wait") run.wait.mockRejectedValueOnce(failure);
      if (phase === "close") sdk.close.mockRejectedValueOnce(failure);

      await submit();

      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        "The run request failed",
      );
      expect(container.textContent).not.toContain("private-provider-token");
      expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(
        false,
      );
      expect(container.querySelector("[aria-label='Run state']")?.textContent).toContain("ready");
      expect(sdk.close).toHaveBeenCalledTimes(phase === "constructor" ? 0 : 1);
    },
  );

  it("clears the alert on retry and completes the next request", async () => {
    sdk.create.mockRejectedValueOnce(failure);
    await submit();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();

    await submit();

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector(".result-badge")?.textContent).toBe("completed");
    expect(sdk.create).toHaveBeenCalledTimes(2);
    expect(sdk.close).toHaveBeenCalledTimes(2);
  });

  it("clears the alert when reset is activated", async () => {
    sdk.create.mockRejectedValueOnce(failure);
    await submit();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();

    await act(async () => container.querySelector<HTMLButtonElement>("button.icon")!.click());

    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
