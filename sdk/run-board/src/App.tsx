import { useMemo, useState } from "react";
import { Bot, CheckCircle2, CircleDashed, Clock3, Play, Search, XCircle } from "lucide-react";
import { OpenClaw, type RunStatus } from "@openclaw/sdk";

type BoardRun = {
  id: string;
  title: string;
  sessionKey: string;
  model: string;
  status: RunStatus;
  updatedAt: number;
  summary: string;
};

const initialRuns: BoardRun[] = [
  {
    id: "run_docs_1",
    title: "Draft SDK quickstart",
    sessionKey: "docs",
    model: "gpt-5.4",
    status: "completed",
    updatedAt: Date.now() - 1000 * 60 * 4,
    summary: "Generated a quickstart and linked it from the cookbook index.",
  },
  {
    id: "run_ui_2",
    title: "Workbench UI review",
    sessionKey: "apps",
    model: "sonnet-4.6",
    status: "accepted",
    updatedAt: Date.now() - 1000 * 60 * 12,
    summary: "Waiting for event stream.",
  },
  {
    id: "run_cancel_3",
    title: "Cancellation smoke",
    sessionKey: "qa",
    model: "openrouter/deepseek/deepseek-r1",
    status: "cancelled",
    updatedAt: Date.now() - 1000 * 60 * 25,
    summary: "Cancelled by operator after timeout budget expired.",
  },
];

const columns: Array<{ status: RunStatus; label: string }> = [
  { status: "accepted", label: "Queued" },
  { status: "completed", label: "Done" },
  { status: "failed", label: "Failed" },
  { status: "cancelled", label: "Stopped" },
  { status: "timed_out", label: "Timed out" },
];

function iconFor(status: RunStatus) {
  if (status === "completed") return <CheckCircle2 size={17} />;
  if (status === "failed" || status === "cancelled" || status === "timed_out") {
    return <XCircle size={17} />;
  }
  return <CircleDashed size={17} />;
}

function relativeTime(timestamp: number): string {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));
  return `${minutes}m ago`;
}

export function App() {
  const [runs, setRuns] = useState(initialRuns);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const visibleRuns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return runs;
    return runs.filter((run) =>
      [run.title, run.sessionKey, run.model, run.summary].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, runs]);

  async function createRun() {
    setCreating(true);
    const oc = new OpenClaw({ gateway: "auto" });
    try {
      const run = await oc.runs.create({
        input: "Summarize cookbook health and propose one follow-up.",
        agentId: "main",
        sessionKey: "board",
        timeoutMs: 60_000,
      });
      const result = await run.wait({ timeoutMs: 120_000 });
      setRuns((current) => [
        {
          id: run.id,
          title: "Cookbook health check",
          sessionKey: "board",
          model: "default",
          status: result.status,
          updatedAt: Date.now(),
          summary: `Finished with ${result.status}.`,
        },
        ...current,
      ]);
    } finally {
      setCreating(false);
      await oc.close();
    }
  }

  return (
    <main className="board-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">OpenClaw SDK</p>
          <h1>Run Board</h1>
        </div>
        <button onClick={createRun} disabled={creating}>
          <Play size={16} />
          New run
        </button>
      </header>

      <section className="metrics">
        <div>
          <Bot />
          <strong>{runs.length}</strong>
          <span>Total runs</span>
        </div>
        <div>
          <CheckCircle2 />
          <strong>{runs.filter((run) => run.status === "completed").length}</strong>
          <span>Completed</span>
        </div>
        <div>
          <Clock3 />
          <strong>{runs.filter((run) => run.status === "accepted").length}</strong>
          <span>Active queue</span>
        </div>
      </section>

      <label className="search">
        <Search size={16} />
        <input
          placeholder="Filter by model, session, title..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <section className="columns">
        {columns.map((column) => {
          const columnRuns = visibleRuns.filter((run) => run.status === column.status);
          return (
            <article className="column" key={column.status}>
              <h2>
                {column.label}
                <span>{columnRuns.length}</span>
              </h2>
              {columnRuns.map((run) => (
                <div className="card" key={run.id}>
                  <div className={`state ${run.status}`}>
                    {iconFor(run.status)}
                    {run.status}
                  </div>
                  <h3>{run.title}</h3>
                  <p>{run.summary}</p>
                  <dl>
                    <div>
                      <dt>Session</dt>
                      <dd>{run.sessionKey}</dd>
                    </div>
                    <div>
                      <dt>Model</dt>
                      <dd>{run.model}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{relativeTime(run.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </article>
          );
        })}
      </section>
    </main>
  );
}
