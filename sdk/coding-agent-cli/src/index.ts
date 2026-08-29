import { createInterface } from "node:readline/promises";
import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import { pathToFileURL } from "node:url";
import { OpenClaw, type Run } from "@openclaw/sdk";

type CliState = {
  agentId: string;
  sessionKey: string;
  model?: string;
  currentRun: Run | null;
};

export type CodingAgentCliOptions = {
  argv?: string[];
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  client?: OpenClaw;
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

function isDirectRun(metaUrl: string): boolean {
  const entry = process.argv[1];
  return entry ? metaUrl === pathToFileURL(entry).href : false;
}

export async function runCodingAgentCli(options: CodingAgentCliOptions = {}): Promise<void> {
  const input = options.input ?? defaultInput;
  const output = options.output ?? defaultOutput;
  const argv = options.argv ?? process.argv.slice(2);

  const oc =
    options.client ??
    new OpenClaw({
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
    const prompt = argv.join(" ");
    if (prompt) {
      await sendPrompt(prompt);
    } else {
      output.write(`${help()}\n\n`);
      const rl = createInterface({ input, output });
      let inFlight: Promise<void> | null = null;
      const cancelActiveRun = async (): Promise<void> => {
        if (state.currentRun) {
          output.write(`${JSON.stringify(await state.currentRun.cancel(), null, 2)}\n`);
        }
      };
      rl.on("SIGINT", () => {
        if (state.currentRun) {
          void cancelActiveRun();
          return;
        }
        rl.close();
      });
      try {
        for (;;) {
          let line: string;
          try {
            line = await rl.question("openclaw> ");
          } catch {
            break;
          }
          if (!line.trim()) {
            continue;
          }
          if (line.startsWith("/")) {
            const keepGoing = await runCommand(line);
            if (!keepGoing) {
              await cancelActiveRun();
              if (inFlight) {
                await inFlight;
              }
              break;
            }
            continue;
          }
          if (inFlight) {
            output.write("A run is already active. Type /cancel to stop it.\n");
            continue;
          }
          inFlight = sendPrompt(line)
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : String(error);
              output.write(`\n${message}\n`);
            })
            .finally(() => {
              inFlight = null;
            });
        }
      } finally {
        rl.close();
      }
    }
  } finally {
    await oc.close();
  }
}

if (isDirectRun(import.meta.url)) {
  await runCodingAgentCli();
}
