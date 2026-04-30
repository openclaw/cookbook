import { pathToFileURL } from "node:url";

export function isDirectRun(metaUrl: string): boolean {
  const entry = process.argv[1];
  return entry ? metaUrl === pathToFileURL(entry).href : false;
}

export async function runMain(action: () => Promise<unknown>): Promise<void> {
  try {
    const result = await action();
    if (result !== undefined) {
      console.log(JSON.stringify(redactSensitiveOutput(result), null, 2));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

export function redactSensitiveOutput(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveOutput(entry, seen));
  }
  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSensitiveKey(key) ? "[REDACTED]" : redactSensitiveOutput(entry, seen),
      ]),
    );
  }
  return value;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("token") ||
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("authorization") ||
    normalized.endsWith("key")
  );
}
