declare module "@openclaw/sdk" {
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
    sessionId?: string;
    sessionKey?: string;
    taskId?: string;
    startedAt?: RunTimestamp;
    endedAt?: RunTimestamp;
    error?: { code?: string; message: string; details?: unknown };
    raw?: unknown;
  };

  export type OpenClawEventType =
    | "run.created"
    | "run.queued"
    | "run.started"
    | "run.completed"
    | "run.failed"
    | "run.cancelled"
    | "run.timed_out"
    | "assistant.delta"
    | "assistant.message"
    | "thinking.delta"
    | "tool.call.started"
    | "tool.call.delta"
    | "tool.call.completed"
    | "tool.call.failed"
    | "approval.requested"
    | "approval.resolved"
    | "question.requested"
    | "question.answered"
    | "artifact.created"
    | "artifact.updated"
    | "session.created"
    | "session.updated"
    | "session.compacted"
    | "task.updated"
    | "git.branch"
    | "git.diff"
    | "git.pr"
    | "raw";

  export type OpenClawEvent<TData = unknown> = {
    version: 1;
    id: string;
    ts: number;
    type: OpenClawEventType;
    runId?: string;
    sessionId?: string;
    sessionKey?: string;
    taskId?: string;
    agentId?: string;
    data: TData;
    raw?: GatewayEvent;
  };

  export type AgentRunParams = {
    input: string;
    agentId?: string;
    model?: string;
    sessionId?: string;
    sessionKey?: string;
    deliver?: boolean;
    timeoutMs?: number;
    label?: string;
    idempotencyKey?: string;
  };

  export type SessionCreateParams = {
    key?: string;
    agentId?: string;
    label?: string;
    model?: string;
    parentSessionKey?: string;
    task?: string;
    message?: string;
  };

  export type SessionSendParams = {
    key?: string;
    message: string;
    thinking?: string;
    attachments?: unknown[];
    timeoutMs?: number;
    idempotencyKey?: string;
  };

  export class Run {
    readonly id: string;
    events(filter?: (event: OpenClawEvent) => boolean): AsyncIterable<OpenClawEvent>;
    wait(options?: { timeoutMs?: number }): Promise<RunResult>;
    cancel(): Promise<unknown>;
  }

  export class Agent {
    readonly id: string;
    run(input: string | Omit<AgentRunParams, "agentId">): Promise<Run>;
  }

  export class Session {
    readonly key: string;
    send(input: string | Omit<SessionSendParams, "key">): Promise<Run>;
    abort(runId?: string): Promise<unknown>;
  }

  export class OpenClaw {
    readonly agents: {
      get(id: string): Promise<Agent>;
    };
    readonly runs: {
      create(params: AgentRunParams): Promise<Run>;
      wait(runId: string, options?: { timeoutMs?: number }): Promise<RunResult>;
      cancel(runId: string, sessionKey?: string): Promise<unknown>;
    };
    readonly sessions: {
      create(params?: SessionCreateParams): Promise<Session>;
    };
    readonly models: {
      status(params?: unknown): Promise<unknown>;
    };
    constructor(options?: OpenClawOptions);
    close(): Promise<void>;
  }
}
