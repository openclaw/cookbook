import type { GatewayEvent, GatewayRequestOptions, OpenClawTransport } from "@openclaw/sdk";
import { OpenClaw } from "@openclaw/sdk";
import { readInput } from "../_shared/config.js";
import { isDirectRun, runMain } from "../_shared/run-main.js";

type RequestCall = {
  method: string;
  params?: unknown;
  options?: GatewayRequestOptions;
};

class CookbookTransport implements OpenClawTransport {
  readonly calls: RequestCall[] = [];

  async request<T = unknown>(
    method: string,
    params?: unknown,
    options?: GatewayRequestOptions,
  ): Promise<T> {
    this.calls.push({ method, params, options });
    if (method === "agent") {
      return { status: "accepted", runId: "cookbook-run" } as T;
    }
    if (method === "agent.wait") {
      return { status: "ok", runId: "cookbook-run", endedAt: Date.now() } as T;
    }
    throw new Error(`unexpected method: ${method}`);
  }

  async *events(): AsyncIterable<GatewayEvent> {
    yield {
      event: "agent",
      payload: {
        runId: "cookbook-run",
        stream: "lifecycle",
        data: { phase: "end" },
      },
    };
  }
}

export async function customTransportRecipe(input = readInput()): Promise<{
  runId: string;
  calls: RequestCall[];
}> {
  const transport = new CookbookTransport();
  const oc = new OpenClaw({ transport });
  const run = await oc.runs.create({ input, idempotencyKey: "cookbook-custom-transport" });
  await run.wait({ timeoutMs: 1_000 });
  return { runId: run.id, calls: transport.calls };
}

if (isDirectRun(import.meta.url)) {
  await runMain(() => customTransportRecipe());
}
