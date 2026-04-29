import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Braces,
  CircleStop,
  Gauge,
  Play,
  Radio,
  RotateCcw,
  Signal,
  Terminal,
  Workflow,
} from "lucide-react";
import { OpenClaw, type OpenClawEvent, type RunResult } from "@openclaw/sdk";

type EventRow = Pick<OpenClawEvent, "type" | "runId" | "ts"> & {
  text?: string;
};

type WorkbenchState = {
  gateway: string;
  agentId: string;
  sessionKey: string;
  model: string;
  prompt: string;
};

const defaults: WorkbenchState = {
  gateway: "auto",
  agentId: "main",
  sessionKey: "workbench",
  model: "",
  prompt: "Inspect this repository and suggest the next useful SDK example.",
};

function terminal(type: string): boolean {
  return (
    type === "run.completed" ||
    type === "run.failed" ||
    type === "run.cancelled" ||
    type === "run.timed_out"
  );
}

function eventTone(type: string): "good" | "bad" | "warn" | "live" {
  if (type === "run.completed") return "good";
  if (type === "run.failed" || type === "run.cancelled") return "bad";
  if (type === "run.timed_out") return "warn";
  return "live";
}

function formatClock(timestamp: string | number | undefined): string {
  if (!timestamp) return "--:--:--";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function App() {
  const [settings, setSettings] = useState(defaults);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [cancel, setCancel] = useState<(() => Promise<unknown>) | null>(null);
  const assistantText = useMemo(
    () =>
      events
        .map((event) => event.text)
        .filter(Boolean)
        .join(""),
    [events],
  );
  const latestEvent = events.length ? events[events.length - 1] : undefined;
  const runId = result?.runId ?? latestEvent?.runId ?? "standby";
  const runState = result?.status ?? (running ? "streaming" : "idle");

  async function startRun() {
    setRunning(true);
    setEvents([]);
    setResult(null);
    const oc = new OpenClaw({ gateway: settings.gateway || "auto" });
    try {
      const run = await oc.runs.create({
        input: settings.prompt,
        agentId: settings.agentId,
        sessionKey: settings.sessionKey,
        timeoutMs: 300_000,
        ...(settings.model ? { model: settings.model } : {}),
      });
      setCancel(() => () => run.cancel());
      for await (const event of run.events()) {
        const delta = (event.data as { delta?: unknown }).delta;
        setEvents((current) => [
          ...current,
          {
            type: event.type,
            runId: event.runId,
            ts: event.ts,
            text: typeof delta === "string" ? delta : undefined,
          },
        ]);
        if (terminal(event.type)) {
          break;
        }
      }
      setResult(await run.wait({ timeoutMs: 120_000 }));
    } finally {
      setCancel(null);
      setRunning(false);
      await oc.close();
    }
  }

  return (
    <main className="workbench-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">OpenClaw SDK</p>
          <h1>Agent Workbench</h1>
          <p className="lede">
            A compact control room for running agents, watching event streams, and cancelling work.
          </p>
        </div>
        <div className="signal-stack" aria-label="Run state">
          <span className={`status-pill ${running ? "live" : "idle"}`}>
            <Radio size={16} />
            {running ? "streaming" : "ready"}
          </span>
          <span>{runId}</span>
        </div>
      </section>

      <section className="telemetry">
        <div>
          <Signal size={18} />
          <span>State</span>
          <strong>{runState}</strong>
        </div>
        <div>
          <Activity size={18} />
          <span>Events</span>
          <strong>{events.length}</strong>
        </div>
        <div>
          <Gauge size={18} />
          <span>Session</span>
          <strong>{settings.sessionKey || "default"}</strong>
        </div>
        <div>
          <Workflow size={18} />
          <span>Model</span>
          <strong>{settings.model || "agent default"}</strong>
        </div>
      </section>

      <section className="grid">
        <form className="panel controls" onSubmit={(event) => (event.preventDefault(), startRun())}>
          <div className="panel-title">
            <Braces size={18} />
            Run controls
          </div>
          <label>
            Gateway
            <input
              id="gateway"
              name="gateway"
              value={settings.gateway}
              onChange={(event) => setSettings({ ...settings, gateway: event.target.value })}
            />
          </label>
          <div className="split">
            <label>
              Agent
              <input
                id="agentId"
                name="agentId"
                value={settings.agentId}
                onChange={(event) => setSettings({ ...settings, agentId: event.target.value })}
              />
            </label>
            <label>
              Session
              <input
                id="sessionKey"
                name="sessionKey"
                value={settings.sessionKey}
                onChange={(event) => setSettings({ ...settings, sessionKey: event.target.value })}
              />
            </label>
          </div>
          <label>
            Model override
            <input
              id="model"
              name="model"
              placeholder="optional"
              value={settings.model}
              onChange={(event) => setSettings({ ...settings, model: event.target.value })}
            />
          </label>
          <label>
            Prompt
            <textarea
              id="prompt"
              name="prompt"
              value={settings.prompt}
              onChange={(event) => setSettings({ ...settings, prompt: event.target.value })}
            />
          </label>
          <div className="toolbar">
            <button className="primary" type="submit" disabled={running}>
              <Play size={16} />
              Run
            </button>
            <button
              className="ghost"
              type="button"
              disabled={!running || !cancel}
              onClick={() => cancel?.()}
            >
              <CircleStop size={16} />
              Cancel
            </button>
            <button className="icon" type="button" onClick={() => (setEvents([]), setResult(null))}>
              <RotateCcw size={16} />
              <span className="sr-only">Reset</span>
            </button>
          </div>
        </form>

        <section className="panel transcript">
          <div className="panel-title split-title">
            <span>
              <Bot size={18} />
              Assistant stream
            </span>
            <small>{assistantText.length.toLocaleString()} chars</small>
          </div>
          <div className="assistant-text">
            <span className="line-gutter">01</span>
            <span>{assistantText || "Run an agent to see streamed text."}</span>
          </div>
        </section>

        <section className="panel event-log">
          <div className="panel-title split-title">
            <span>
              <Activity size={18} />
              Event timeline
            </span>
            <small>{formatClock(latestEvent?.ts)}</small>
          </div>
          <div className="timeline">
            {events.length === 0 ? (
              <div className="empty-state">No events captured.</div>
            ) : (
              events.map((event, index) => (
                <div
                  className={`event-row ${eventTone(event.type)}`}
                  key={`${event.type}-${index}`}
                >
                  <span className="event-dot" />
                  <div>
                    <strong>{event.type}</strong>
                    <small>{event.runId ?? "no run id"}</small>
                  </div>
                  <time>{formatClock(event.ts)}</time>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel result">
          <div className="panel-title split-title">
            <span>
              <Terminal size={18} />
              Result
            </span>
            <small className={`result-badge ${result?.status ?? "idle"}`}>
              {result?.status ?? "pending"}
            </small>
          </div>
          <pre>{result ? JSON.stringify(result, null, 2) : "No result yet."}</pre>
        </section>
      </section>
    </main>
  );
}
