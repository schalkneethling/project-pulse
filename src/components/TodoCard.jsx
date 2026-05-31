import { linkify } from "../lib/linkify";
import { timeAgo } from "../lib/helpers";

export const STATUS_META = {
  backlog: { label: "Backlog", pill: "bg-slate-500/20 text-slate-300" },
  ready: { label: "Ready", pill: "bg-sky-500/20 text-sky-300" },
  in_progress: { label: "In Progress", pill: "bg-blue-500/20 text-blue-300" },
  on_hold: { label: "On Hold", pill: "bg-amber-500/20 text-amber-300" },
  done: { label: "Done", pill: "bg-emerald-500/20 text-emerald-300" },
};

export const STATUS_ORDER = ["backlog", "ready", "in_progress", "on_hold", "done"];

const DUE_STYLES = {
  today: "bg-yellow-950/40 border-yellow-600/70",
  late: "bg-red-950/40 border-red-600/70",
};

const LINK_CLASS =
  "inline-block max-w-[min(100%,72ch)] truncate align-bottom text-sky-400 hover:text-sky-300 underline underline-offset-2";

export function TodoCard({
  todo,
  onUpdate,
  onDelete,
  onEdit,
  projectName,
  draggable = false,
  compact = false,
}) {
  const { id, note, who, source, sourceUrl, status, dueDate, createdAt } = todo;
  const dueState = getDueState(dueDate, status);
  const segments = linkify(note);
  const meta = STATUS_META[status] || STATUS_META.backlog;

  return (
    <div
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData("text/plain", id);
              e.dataTransfer.effectAllowed = "move";
            }
          : undefined
      }
      className={`bg-slate-800/50 border rounded-xl p-4 space-y-3 ${DUE_STYLES[dueState] || "border-slate-700/50"} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
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
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${meta.pill}`}
        >
          {meta.label}
        </span>
      </div>

      {!compact && (who || source || projectName || dueDate) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
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
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <label className="sr-only" htmlFor={`status-${id}`}>
          Status
        </label>
        <select
          id={`status-${id}`}
          value={status}
          onChange={(e) => onUpdate(id, { status: e.target.value })}
          className="text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          aria-label={`Status for ${note}`}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(todo)}
            className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-sky-500 hover:text-sky-300 transition-colors"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function getDueState(dueDate, status) {
  if (!dueDate || status === "done") {
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
