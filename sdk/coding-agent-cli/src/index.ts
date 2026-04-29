import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { OpenClaw, type Run } from "@openclaw/sdk";

type CliState = {
  agentId: string;
  sessionKey: string;
  model?: string;
  currentRun: Run | null;
};

const oc = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY ?? "auto",
  token: process.env.OPENCLAW_TOKEN,
  password: process.env.OPENCLAW_PASSWORD,
});

const state: CliState = {
  agentId: process.env.OPENCLAW_AGENT_ID ?? "main",
  sessionKey: process.env.OPENCLAW_SESSION_KEY ?? "cli",
  model: process.env.OPENCLAW_MODEL,
  currentRun: null,
};

function help(): string {
  return [
    "Commands:",
    "  /help             Show commands",
    "  /model <model>    Set model override",
    "  /session <key>    Switch session key",
    "  /status           Print model/auth status",
    "  /cancel           Cancel the active run",
    "  /exit             Exit",
  ].join("\n");
}

async function sendPrompt(prompt: string): Promise<void> {
  const run = await oc.runs.create({
    input: prompt,
    agentId: state.agentId,
    sessionKey: state.sessionKey,
    timeoutMs: 300_000,
    ...(state.model ? { model: state.model } : {}),
  });
  state.currentRun = run;
  try {
    for await (const event of run.events()) {
      if (event.type === "assistant.delta") {
        const delta = (event.data as { delta?: unknown }).delta;
        if (typeof delta === "string") {
          output.write(delta);
        }
      }
      if (event.type.startsWith("run.")) {
        output.write(`\n[${event.type}]`);
      }
      if (
        event.type === "run.completed" ||
        event.type === "run.failed" ||
        event.type === "run.cancelled" ||
        event.type === "run.timed_out"
      ) {
        break;
      }
    }
    const result = await run.wait({ timeoutMs: 120_000 });
    output.write(`\n${JSON.stringify(result, null, 2)}\n`);
  } finally {
    if (state.currentRun === run) {
      state.currentRun = null;
    }
  }
}

async function runCommand(line: string): Promise<boolean> {
  const [command, ...rest] = line.trim().split(/\s+/);
  switch (command) {
    case "/help":
      output.write(`${help()}\n`);
      return true;
    case "/model":
      state.model = rest.join(" ") || undefined;
      output.write(`model=${state.model ?? "default"}\n`);
      return true;
    case "/session":
      state.sessionKey = rest.join(" ") || "cli";
      output.write(`session=${state.sessionKey}\n`);
      return true;
    case "/status":
      output.write(`${JSON.stringify(await oc.models.status({ probe: false }), null, 2)}\n`);
      return true;
    case "/cancel":
      if (!state.currentRun) {
        output.write("No active run.\n");
        return true;
      }
      output.write(`${JSON.stringify(await state.currentRun.cancel(), null, 2)}\n`);
      return true;
    case "/exit":
    case "/quit":
      return false;
    default:
      output.write("Unknown command. Type /help.\n");
      return true;
  }
}

try {
  const prompt = process.argv.slice(2).join(" ");
  if (prompt) {
    await sendPrompt(prompt);
  } else {
    output.write(`${help()}\n\n`);
    const rl = createInterface({ input, output });
    for (;;) {
      const line = await rl.question("openclaw> ");
      if (!line.trim()) {
        continue;
      }
      const keepGoing = line.startsWith("/")
        ? await runCommand(line)
        : (await sendPrompt(line), true);
      if (!keepGoing) {
        break;
      }
    }
    rl.close();
  }
} finally {
  await oc.close();
}
