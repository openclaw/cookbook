import { createClient, type CookbookConnectionOptions } from "../_shared/config.js";
import { isDirectRun, runMain } from "../_shared/run-main.js";

export async function modelStatusRecipe(
  options: CookbookConnectionOptions & { probe?: boolean } = {},
): Promise<unknown> {
  const oc = createClient(options);
  try {
    const probe = options.probe ?? process.env.OPENCLAW_MODEL_STATUS_PROBE === "1";
    return await oc.models.status({ probe });
  } finally {
    await oc.close();
  }
}

if (isDirectRun(import.meta.url)) {
  await runMain(() => modelStatusRecipe());
}
