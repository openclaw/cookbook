import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  gateway: process.env.OPENCLAW_GATEWAY ?? "auto",
  token: process.env.OPENCLAW_TOKEN,
  password: process.env.OPENCLAW_PASSWORD,
});

const agentId = process.env.OPENCLAW_AGENT_ID ?? "main";
const sessionKey = process.env.OPENCLAW_SESSION_KEY ?? "quickstart";
const model = process.env.OPENCLAW_MODEL;
const prompt = process.argv.slice(2).join(" ") || "Explain this project in one paragraph.";

try {
  const run = await oc.runs.create({
    input: prompt,
    agentId,
    sessionKey,
    timeoutMs: 60_000,
    ...(model ? { model } : {}),
  });

  for await (const event of run.events()) {
    if (event.type === "assistant.delta") {
      const delta = (event.data as { delta?: unknown }).delta;
      if (typeof delta === "string") {
        process.stdout.write(delta);
      }
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
  process.stdout.write(`\n\n${JSON.stringify(result, null, 2)}\n`);
} finally {
  await oc.close();
}
