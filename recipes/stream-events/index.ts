import type { OpenClawEvent, OpenClawEventType } from "@openclaw/sdk";
import {
  createClient,
  optionalModel,
  readAgentId,
  readInput,
  readSessionKey,
  readTimeoutMs,
  type RunRecipeOptions,
} from "../_shared/config.js";
import { isDirectRun, runMain } from "../_shared/run-main.js";

const terminalEvents = new Set<OpenClawEventType>([
  "run.completed",
  "run.failed",
  "run.cancelled",
  "run.timed_out",
]);

export async function streamEventsRecipe(
  options: RunRecipeOptions = {},
): Promise<Array<Pick<OpenClawEvent, "type" | "runId">>> {
  const oc = createClient(options);
  try {
    const run = await oc.runs.create({
      input: readInput(options.input),
      agentId: readAgentId(options.agentId),
      sessionKey: readSessionKey(options.sessionKey),
      timeoutMs: readTimeoutMs(options.timeoutMs, 60_000),
      ...optionalModel(options.model),
    });

    const seen: Array<Pick<OpenClawEvent, "type" | "runId">> = [];
    for await (const event of run.events()) {
      seen.push({ type: event.type, runId: event.runId });
      if (terminalEvents.has(event.type)) {
        break;
      }
    }
    return seen;
  } finally {
    await oc.close();
  }
}

if (isDirectRun(import.meta.url)) {
  await runMain(() => streamEventsRecipe());
}
