import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDashed,
  Clock3,
  LayoutDashboard,
  Play,
  Search,
  SlidersHorizontal,
  TimerReset,
  XCircle,
} from "lucide-react";
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

const filters: Array<{ value: RunStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Active" },
  { value: "completed", label: "Done" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Stopped" },
  { value: "timed_out", label: "Timed out" },
];

function iconFor(status: RunStatus) {
  if (status === "completed") return <CheckCircle2 size={17} />;
  if (status === "timed_out") return <TimerReset size={17} />;
  if (status === "failed" || status === "cancelled") {
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
  const [statusFilter, setStatusFilter] = useState<RunStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const statusCounts = useMemo(
    () =>
      runs.reduce(
        (counts, run) => ({
          ...counts,
          [run.status]: (counts[run.status] ?? 0) + 1,
        }),
        {} as Partial<Record<RunStatus, number>>,
      ),
    [runs],
  );
  const visibleRuns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return runs.filter((run) => {
      const matchesStatus = statusFilter === "all" || run.status === statusFilter;
      const matchesQuery =
        !normalized ||
        [run.title, run.sessionKey, run.model, run.summary].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      return matchesStatus && matchesQuery;
    });
  }, [query, runs, statusFilter]);

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
          <p className="lede">A live operations board for SDK-created agent runs.</p>
        </div>
        <button onClick={createRun} disabled={creating}>
          <Play size={16} />
          {creating ? "Running" : "New run"}
        </button>
      </header>

      <section className="metrics">
        <div>
          <LayoutDashboard />
          <strong>{runs.length}</strong>
          <span>Total runs</span>
        </div>
        <div>
          <CheckCircle2 />
          <strong>{statusCounts.completed ?? 0}</strong>
          <span>Completed</span>
        </div>
        <div>
          <Clock3 />
          <strong>{statusCounts.accepted ?? 0}</strong>
          <span>Active queue</span>
        </div>
        <div>
          <AlertTriangle />
          <strong>
            {(statusCounts.failed ?? 0) +
              (statusCounts.cancelled ?? 0) +
              (statusCounts.timed_out ?? 0)}
          </strong>
          <span>Needs review</span>
        </div>
      </section>

      <section className="command-strip">
        <label className="search">
          <Search size={16} />
          <input
            id="run-search"
            name="run-search"
            placeholder="Filter by model, session, title..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filters" aria-label="Status filter">
          <SlidersHorizontal size={16} />
          {filters.map((filter) => (
            <button
              className={statusFilter === filter.value ? "active" : ""}
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="columns">
        {columns.map((column) => {
          const columnRuns = visibleRuns.filter((run) => run.status === column.status);
          return (
            <article className="column" key={column.status}>
              <h2>
                {column.label}
                <span>{columnRuns.length}</span>
              </h2>
              {columnRuns.length === 0 ? (
                <div className="empty-lane">No matching runs.</div>
              ) : (
                columnRuns.map((run) => (
                  <div className={`card ${run.status}`} key={run.id}>
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
                    <small className="run-id">
                      <Bot size={13} />
                      {run.id}
                    </small>
                  </div>
                ))
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
