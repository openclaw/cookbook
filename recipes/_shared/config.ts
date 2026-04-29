import { OpenClaw, type OpenClawOptions } from "@openclaw/sdk";

export type CookbookConnectionOptions = {
  gateway?: string;
  token?: string;
  password?: string;
};

export type RunRecipeOptions = CookbookConnectionOptions & {
  agentId?: string;
  input?: string;
  model?: string;
  sessionKey?: string;
  timeoutMs?: number;
  waitTimeoutMs?: number;
};

export function readConnectionOptions(options: CookbookConnectionOptions = {}): OpenClawOptions {
  return {
    gateway: options.gateway ?? process.env.OPENCLAW_GATEWAY ?? "auto",
    token: options.token ?? process.env.OPENCLAW_TOKEN,
    password: options.password ?? process.env.OPENCLAW_PASSWORD,
  };
}

export function createClient(options: CookbookConnectionOptions = {}): OpenClaw {
  return new OpenClaw(readConnectionOptions(options));
}

export function readAgentId(agentId?: string): string {
  return agentId ?? process.env.OPENCLAW_AGENT_ID ?? "main";
}

export function readInput(input?: string): string {
  return input ?? (process.argv.slice(2).join(" ") || "Say hello from the OpenClaw SDK cookbook.");
}

export function readSessionKey(sessionKey?: string): string {
  return sessionKey ?? process.env.OPENCLAW_SESSION_KEY ?? "cookbook";
}

export function readTimeoutMs(value: number | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return fallback;
}

export function optionalModel(model?: string): { model?: string } {
  const resolved = model ?? process.env.OPENCLAW_MODEL;
  return resolved ? { model: resolved } : {};
}
