import { linkify } from "../lib/linkify";
import { timeAgo } from "../lib/helpers";

const STATUS_STYLES = {
  open: "bg-sky-500/20 text-sky-300",
  waiting: "bg-amber-500/20 text-amber-300",
  resolved: "bg-emerald-500/20 text-emerald-300",
};

const STATUS_LABELS = {
  open: "open",
  waiting: "waiting",
  resolved: "done",
};

const DUE_STYLES = {
  today: "bg-yellow-950/40 border-yellow-600/70",
  late: "bg-red-950/40 border-red-600/70",
};

const LINK_CLASS =
  "inline-block max-w-[min(100%,72ch)] truncate align-bottom text-sky-400 hover:text-sky-300 underline underline-offset-2";

export function TodoCard({ todo, onUpdate, onDelete, projectName }) {
  const { id, note, who, source, sourceUrl, status, dueDate, createdAt } = todo;
  const dueState = getDueState(dueDate, status);
  const segments = linkify(note);

  return (
    <div
      className={`bg-slate-800/50 border rounded-xl p-4 space-y-3 ${DUE_STYLES[dueState] || "border-slate-700/50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-slate-200">
          {segments.map((seg) =>
            seg.type === "link" ? (
              <a
                key={`link:${seg.start}:${seg.value}`}
                href={seg.value}
                target="_blank"
                rel="noopener noreferrer"
                title={seg.value}
                className={LINK_CLASS}
              >
                {seg.value}
              </a>
            ) : (
              <span key={`text:${seg.start}:${seg.value}`}>{seg.value}</span>
            ),
          )}
        </p>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {who && <span>Who: {who}</span>}
        {source && (
          <span>
            Source:{" "}
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                {source}
              </a>
            ) : (
              source
            )}
          </span>
        )}
        {projectName && <span>Project: {projectName}</span>}
        {dueDate && (
          <span
            className={
              dueState === "late" ? "text-red-300" : dueState === "today" ? "text-yellow-300" : ""
            }
          >
            Due {formatDateKey(dueDate)}
          </span>
        )}
        <span>{timeAgo(createdAt)}</span>
      </div>

      <div className="flex gap-2">
        {status !== "open" && (
          <button
            type="button"
            onClick={() => onUpdate(id, { status: "open" })}
            className="text-xs text-slate-400 hover:text-sky-300 transition-colors"
          >
            Open
          </button>
        )}
        {status !== "waiting" && (
          <button
            type="button"
            onClick={() => onUpdate(id, { status: "waiting" })}
            className="text-xs text-slate-400 hover:text-amber-300 transition-colors"
          >
            Waiting
          </button>
        )}
        {status !== "resolved" && (
          <button
            type="button"
            onClick={() => onUpdate(id, { status: "resolved" })}
            className="text-xs text-slate-400 hover:text-emerald-300 transition-colors"
          >
            Mark done
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function getDueState(dueDate, status) {
  if (!dueDate || status === "resolved") {
    return null;
  }

  const today = new Date();
  const todayKey = toDateKey(today);

  if (dueDate === todayKey) {
    return "today";
  }
  return dueDate < todayKey ? "late" : null;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(navigator?.languages?.[0] ?? "en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
