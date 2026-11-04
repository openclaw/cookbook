import { describe, expect, it } from "vitest";
import { redactSensitiveOutput as recipe } from "../recipes/_shared/run-main.js";
import { redactSensitiveOutput as workbench } from "../sdk/agent-workbench/src/redact-sensitive-output.js";
import { redactSensitiveOutput as codingAgent } from "../sdk/coding-agent-cli/src/redact-sensitive-output.js";
import { redactSensitiveOutput as quickstart } from "../sdk/quickstart/src/redact-sensitive-output.js";

describe.each([recipe, workbench, codingAgent, quickstart])("circular output", (redact) => {
  it("serializes cyclic arrays while retaining nested redaction", () => {
    const value: unknown[] = [{ token: "synthetic-secret", text: "visible" }];
    value.push(value);
    expect(JSON.stringify(redact(value))).toBe(
      '[{"token":"[REDACTED]","text":"visible"},"[Circular]"]',
    );
  });
});
