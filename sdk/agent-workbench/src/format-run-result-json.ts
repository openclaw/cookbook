import { redactSensitiveOutput } from "./redact-sensitive-output.js";

export function formatRunResultJson(result: unknown): string {
  return JSON.stringify(redactSensitiveOutput(result), null, 2);
}
