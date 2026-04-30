import { cancelRunRecipe } from "../../../recipes/cancel-a-run/index.js";
import { modelStatusRecipe } from "../../../recipes/model-status/index.js";
import { reuseSessionRecipe } from "../../../recipes/reuse-session/index.js";
import { runAgentRecipe } from "../../../recipes/run-an-agent/index.js";
import { redactSensitiveOutput } from "../../../recipes/_shared/run-main.js";
import { streamEventsRecipe } from "../../../recipes/stream-events/index.js";

function usage(): string {
  return [
    "Usage: pnpm example:node-cli <command> [prompt]",
    "",
    "Commands:",
    "  run       Start a run and wait for the result",
    "  stream    Start a run and print normalized event summaries",
    "  cancel    Start a run and cancel it",
    "  session   Reuse a session for two messages",
    "  models    Print model provider/auth status",
  ].join("\n");
}

async function main(argv: string[]): Promise<unknown> {
  const [command, ...rest] = argv;
  const input = rest.join(" ") || undefined;
  switch (command) {
    case "run":
      return await runAgentRecipe({ input });
    case "stream":
      return await streamEventsRecipe({ input });
    case "cancel":
      return await cancelRunRecipe({ input });
    case "session":
      return await reuseSessionRecipe({ firstInput: input });
    case "models":
      return await modelStatusRecipe();
    default:
      return usage();
  }
}

try {
  const result = await main(process.argv.slice(2));
  console.log(
    typeof result === "string" ? result : JSON.stringify(redactSensitiveOutput(result), null, 2),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
