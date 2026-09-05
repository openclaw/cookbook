// Keep in sync with recipes/_shared/run-main.ts so this example stays standalone.
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
