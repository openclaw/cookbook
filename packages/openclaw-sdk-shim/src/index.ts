export type GatewayRequestOptions = {
  expectFinal?: boolean;
  timeoutMs?: number | null;
};

export type GatewayEvent = {
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: unknown;
};

export type OpenClawTransport = {
  request<T = unknown>(
    method: string,
    params?: unknown,
    options?: GatewayRequestOptions,
  ): Promise<T>;
  events(filter?: (event: GatewayEvent) => boolean): AsyncIterable<GatewayEvent>;
  close?(): Promise<void> | void;
};

export type OpenClawOptions = {
  gateway?: "auto" | (string & {});
  url?: string;
  token?: string;
  password?: string;
  requestTimeoutMs?: number;
  transport?: OpenClawTransport;
};

export type RunStatus = "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
export type RunTimestamp = string | number;

export type RunResult = {
  runId: string;
  status: RunStatus;
  sessionKey?: string;
  startedAt?: RunTimestamp;
  endedAt?: RunTimestamp;
  raw?: unknown;
};

export type OpenClawEventType =
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "run.cancelled"
  | "run.timed_out"
  | "assistant.delta"
  | "raw";

export type OpenClawEvent<TData = unknown> = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  data: TData;
  raw?: GatewayEvent;
};

export type AgentRunParams = {
  input: string;
  agentId?: string;
  model?: string;
  sessionKey?: string;
  timeoutMs?: number;
  idempotencyKey?: string;
};

export type SessionCreateParams = {
  key?: string;
  agentId?: string;
  model?: string;
};

export type SessionSendParams = {
  key?: string;
  message: string;
  timeoutMs?: number;
};

function normalizeEvent(event: GatewayEvent): OpenClawEvent {
  const payload =
    typeof event.payload === "object" && event.payload !== null
      ? (event.payload as Record<string, unknown>)
      : {};
  const data =
    typeof payload.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : {};
  const phase = typeof data.phase === "string" ? data.phase : undefined;
  const stream = typeof payload.stream === "string" ? payload.stream : undefined;
  const runId = typeof payload.runId === "string" ? payload.runId : undefined;
  const type =
    stream === "assistant"
      ? "assistant.delta"
      : phase === "start"
        ? "run.started"
        : phase === "end"
          ? "run.completed"
          : "raw";
  return {
    version: 1,
    id: `${event.seq ?? "test"}:${event.event}`,
    ts: Date.now(),
    type,
    runId,
    data,
    raw: event,
  };
}

class ShimRun {
  constructor(
    private readonly client: OpenClaw,
    readonly id: string,
    private readonly sessionKey?: string,
  ) {}

  async *events(): AsyncIterable<OpenClawEvent> {
    if (this.client.transport) {
      for await (const event of this.client.transport.events()) {
        yield normalizeEvent(event);
      }
      return;
    }
    yield {
      version: 1,
      id: "start",
      ts: Date.now(),
      type: "run.started",
      runId: this.id,
      data: {},
    };
    yield {
      version: 1,
      id: "message",
      ts: Date.now(),
      type: "assistant.delta",
      runId: this.id,
      data: { delta: "hello from OpenClaw" },
    };
    yield {
      version: 1,
      id: "end",
      ts: Date.now(),
      type: "run.completed",
      runId: this.id,
      data: {},
    };
  }

  async wait(_options?: { timeoutMs?: number }): Promise<RunResult> {
    if (this.client.transport) {
      const raw = await this.client.transport.request<Record<string, unknown>>(
        "agent.wait",
        { runId: this.id },
        { timeoutMs: null },
      );
      return {
        runId: this.id,
        status: raw.status === "ok" ? "completed" : "failed",
        endedAt: typeof raw.endedAt === "number" ? raw.endedAt : Date.now(),
        raw,
      };
    }
    return {
      runId: this.id,
      status: "completed",
      sessionKey: this.sessionKey,
      endedAt: Date.now(),
    };
  }

  async cancel(): Promise<unknown> {
    return { ok: true, status: "aborted", abortedRunId: this.id };
  }
}

class ShimAgent {
  constructor(
    private readonly client: OpenClaw,
    readonly id: string,
  ) {}

  async run(input: string | Omit<AgentRunParams, "agentId">): Promise<ShimRun> {
    const params =
      typeof input === "string" ? { input, agentId: this.id } : { ...input, agentId: this.id };
    return await this.client.runs.create(params);
  }
}

class ShimSession {
  constructor(
    private readonly client: OpenClaw,
    readonly key: string,
  ) {}

  async send(input: string | Omit<SessionSendParams, "key">): Promise<ShimRun> {
    const message = typeof input === "string" ? input : input.message;
    return await this.client.runs.create({ input: message, sessionKey: this.key });
  }

  async abort(runId?: string): Promise<unknown> {
    return { ok: true, status: runId ? "aborted" : "no-active-run" };
  }
}

export class OpenClaw {
  readonly transport?: OpenClawTransport;

  constructor(options: OpenClawOptions = {}) {
    this.transport = options.transport;
  }

  readonly agents = {
    get: async (id: string) => new ShimAgent(this, id),
  };

  readonly runs = {
    create: async (params: AgentRunParams) => {
      if (this.transport) {
        const raw = await this.transport.request<Record<string, unknown>>("agent", params, {
          expectFinal: false,
        });
        const runId = typeof raw.runId === "string" ? raw.runId : "transport-run";
        return new ShimRun(this, runId, params.sessionKey);
      }
      return new ShimRun(this, `run_${Math.random().toString(36).slice(2, 8)}`, params.sessionKey);
    },
    wait: async (runId: string) => new ShimRun(this, runId).wait(),
    cancel: async (runId: string) => ({ ok: true, abortedRunId: runId, status: "aborted" }),
  };

  readonly sessions = {
    create: async (params: SessionCreateParams = {}) =>
      new ShimSession(this, params.key ?? "cookbook"),
  };

  readonly models = {
    status: async (_params?: unknown) => ({
      providers: [
        { id: "openai", authenticated: true, defaultModel: "gpt-5.4" },
        { id: "anthropic", authenticated: true, defaultModel: "sonnet-4.6" },
        { id: "openrouter", authenticated: false },
      ],
    }),
  };

  async close(): Promise<void> {
    await this.transport?.close?.();
  }
}

export { ShimAgent as Agent, ShimRun as Run, ShimSession as Session };
