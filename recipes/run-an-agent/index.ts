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

export async function runAgentRecipe(options: RunRecipeOptions = {}): Promise<RunResult> {
  const oc = createClient(options);
  try {
    const agent = await oc.agents.get(readAgentId(options.agentId));
    const run = await agent.run({
      input: readInput(options.input),
      sessionKey: readSessionKey(options.sessionKey),
      timeoutMs: readTimeoutMs(options.timeoutMs, 60_000),
      ...optionalModel(options.model),
    });
    return await run.wait({ timeoutMs: readTimeoutMs(options.waitTimeoutMs, 120_000) });
  } finally {
    await oc.close();
  }
}

if (isDirectRun(import.meta.url)) {
  await runMain(() => runAgentRecipe());
}
