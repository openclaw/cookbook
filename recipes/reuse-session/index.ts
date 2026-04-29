import type { RunResult } from "@openclaw/sdk";
import {
  createClient,
  optionalModel,
  readAgentId,
  readSessionKey,
  readTimeoutMs,
  type RunRecipeOptions,
} from "../_shared/config.js";
import { isDirectRun, runMain } from "../_shared/run-main.js";

export type ReuseSessionRecipeResult = {
  sessionKey: string;
  results: RunResult[];
};

export async function reuseSessionRecipe(
  options: RunRecipeOptions & { firstInput?: string; secondInput?: string } = {},
): Promise<ReuseSessionRecipeResult> {
  const oc = createClient(options);
  try {
    const sessionKey = readSessionKey(options.sessionKey);
    const session = await oc.sessions.create({
      key: sessionKey,
      agentId: readAgentId(options.agentId),
      ...optionalModel(options.model),
    });
    const first = await session.send({
      message: options.firstInput ?? "Remember that the cookbook session is working.",
      timeoutMs: readTimeoutMs(options.timeoutMs, 60_000),
    });
    const second = await session.send({
      message: options.secondInput ?? "What did I ask you to remember?",
      timeoutMs: readTimeoutMs(options.timeoutMs, 60_000),
    });
    const waitOptions = { timeoutMs: readTimeoutMs(options.waitTimeoutMs, 120_000) };
    return {
      sessionKey,
      results: [await first.wait(waitOptions), await second.wait(waitOptions)],
    };
  } finally {
    await oc.close();
  }
}

if (isDirectRun(import.meta.url)) {
  await runMain(() => reuseSessionRecipe());
}
