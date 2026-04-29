import { useMemo, useState } from "react";
import { Activity, Bot, CircleStop, Play, Radio, RotateCcw, Terminal } from "lucide-react";
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
        <div className="status-pill">
          <Radio size={16} />
          {running ? "streaming" : "ready"}
        </div>
      </section>

      <section className="grid">
        <form className="panel controls" onSubmit={(event) => (event.preventDefault(), startRun())}>
          <label>
            Gateway
            <input
              value={settings.gateway}
              onChange={(event) => setSettings({ ...settings, gateway: event.target.value })}
            />
          </label>
          <div className="split">
            <label>
              Agent
              <input
                value={settings.agentId}
                onChange={(event) => setSettings({ ...settings, agentId: event.target.value })}
              />
            </label>
            <label>
              Session
              <input
                value={settings.sessionKey}
                onChange={(event) => setSettings({ ...settings, sessionKey: event.target.value })}
              />
            </label>
          </div>
          <label>
            Model override
            <input
              placeholder="optional"
              value={settings.model}
              onChange={(event) => setSettings({ ...settings, model: event.target.value })}
            />
          </label>
          <label>
            Prompt
            <textarea
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
            </button>
          </div>
        </form>

        <section className="panel transcript">
          <div className="panel-title">
            <Bot size={18} />
            Assistant stream
          </div>
          <div className="assistant-text">
            {assistantText || "Run an agent to see streamed text."}
          </div>
        </section>

        <section className="panel event-log">
          <div className="panel-title">
            <Activity size={18} />
            Events
          </div>
          {events.map((event, index) => (
            <div className="event-row" key={`${event.type}-${index}`}>
              <span>{event.type}</span>
              <small>{event.runId ?? "no run id"}</small>
            </div>
          ))}
        </section>

        <section className="panel result">
          <div className="panel-title">
            <Terminal size={18} />
            Result
          </div>
          <pre>{result ? JSON.stringify(result, null, 2) : "No result yet."}</pre>
        </section>
      </section>
    </main>
  );
}
