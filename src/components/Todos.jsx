import { useState } from "react";
import { linkify } from "../lib/linkify";
import { timeAgo } from "../lib/helpers";

export function TodoForm({ onCreate, projects }) {
  const [note, setNote] = useState("");
  const [who, setWho] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    onCreate({
      note: note.trim(),
      who: who.trim() || undefined,
      source: source.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      projectId: projectId || undefined,
      dueDate: dueDate || undefined,
    });

    setNote("");
    setWho("");
    setSource("");
    setSourceUrl("");
    setProjectId("");
    setDueDate("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="todo-note" className="sr-only">Todo</label>
        <input
          id="todo-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a todo..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Save
        </button>
      </div>

      <details className="group">
        <summary className="text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer list-none">
          More details
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label htmlFor="todo-who" className="sr-only">Who is involved</label>
            <input
              id="todo-who"
              type="text"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Who is involved? e.g. @alice, @bob"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="todo-source" className="sr-only">Source</label>
            <input
              id="todo-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Where? e.g. #backend, DM, Jira-123"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="todo-source-url" className="sr-only">Source link</label>
            <input
              id="todo-source-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Link (optional)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="todo-due-date" className="sr-only">Due date</label>
            <input
              id="todo-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          {projects?.length > 0 && (
            <div>
              <label htmlFor="todo-project" className="sr-only">Linked project</label>
              <select
                id="todo-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || "Untitled"}
                </option>
              ))}
              </select>
            </div>
          )}
        </div>
      </details>
    </form>
  );
}

export function TodoCard({ todo, onUpdate, onDelete, projectName }) {
  const { id, note, who, source, sourceUrl, status, dueDate, createdAt } = todo;

  const statusStyles = {
    open: "bg-sky-500/20 text-sky-300",
    waiting: "bg-amber-500/20 text-amber-300",
    resolved: "bg-emerald-500/20 text-emerald-300",
  };
  const statusLabels = {
    open: "open",
    waiting: "waiting",
    resolved: "done",
  };
  const dueState = getDueState(dueDate, status);
  const dueStyles = {
    today: "bg-yellow-950/40 border-yellow-600/70",
    late: "bg-red-950/40 border-red-600/70",
  };

  const segments = linkify(note);

  return (
    <div className={`bg-slate-800/50 border rounded-xl p-4 space-y-3 ${dueStyles[dueState] || "border-slate-700/50"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-slate-200 flex-1">
          {segments.map((seg, i) =>
            seg.type === "link" ? (
              <a
                key={i}
                href={seg.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
              >
                {seg.value}
              </a>
            ) : (
              <span key={i}>{seg.value}</span>
            )
          )}
        </p>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[status]}`}
        >
          {statusLabels[status] || status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {who && <span>Who: {who}</span>}
        {source && (
          <span>
            Source:{" "}
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
              >
                {source}
              </a>
            ) : (
              source
            )}
          </span>
        )}
        {projectName && <span>Project: {projectName}</span>}
        {dueDate && (
          <span className={dueState === "late" ? "text-red-300" : dueState === "today" ? "text-yellow-300" : ""}>
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
            Done
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

const STATUS_TABS = [
  ["all", "all"],
  ["open", "open"],
  ["waiting", "waiting"],
  ["resolved", "done"],
];

export function TodoList({ todos, onUpdate, onDelete, projects }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const projectMap = Object.fromEntries(
    (projects || []).map((p) => [p.id, p.name || "Untitled"])
  );

  const filtered = todos.filter((todo) => {
    if (activeTab !== "all" && todo.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [todo.note, todo.who, todo.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {STATUS_TABS.map(([tab, label]) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <label htmlFor="todo-search" className="sr-only">Search todos</label>
          <input
            id="todo-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search todos..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No todos found.
          </p>
        ) : (
          filtered.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onUpdate={onUpdate}
              onDelete={onDelete}
              projectName={todo.projectId ? projectMap[todo.projectId] : null}
            />
          ))
        )}
      </div>
    </div>
  );
}

function getDueState(dueDate, status) {
  if (!dueDate || status === "resolved") return null;

  const today = new Date();
  const todayKey = toDateKey(today);

  if (dueDate === todayKey) return "today";
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
  return new Date(year, month - 1, day).toLocaleDateString(
    navigator?.languages?.[0] ?? "en-ZA",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
