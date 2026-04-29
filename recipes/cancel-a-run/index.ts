import type { RunResult } from "@openclaw/sdk";
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

export type CancelRunRecipeResult = {
  runId: string;
  cancelResponse: unknown;
  result: RunResult;
};

export async function cancelRunRecipe(
  options: RunRecipeOptions & { cancelAfterMs?: number } = {},
): Promise<CancelRunRecipeResult> {
  const oc = createClient(options);
  try {
    const run = await oc.runs.create({
      input: readInput(options.input),
      agentId: readAgentId(options.agentId),
      sessionKey: readSessionKey(options.sessionKey),
      timeoutMs: readTimeoutMs(options.timeoutMs, 300_000),
      ...optionalModel(options.model),
    });
    const cancelAfterMs = readTimeoutMs(
      options.cancelAfterMs ?? Number(process.env.OPENCLAW_CANCEL_AFTER_MS),
      1_000,
    );
    await new Promise((resolve) => setTimeout(resolve, cancelAfterMs));
    const cancelResponse = await run.cancel();
    const result = await run.wait({ timeoutMs: readTimeoutMs(options.waitTimeoutMs, 30_000) });
    return { runId: run.id, cancelResponse, result };
  } finally {
    await oc.close();
  }
}

if (isDirectRun(import.meta.url)) {
  await runMain(() => cancelRunRecipe());
}
