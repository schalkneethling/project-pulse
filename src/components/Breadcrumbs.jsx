import { useState } from "react";
import { linkify } from "../lib/linkify";
import { timeAgo } from "../lib/helpers";

// ─── Quick-capture form ────────────────────────────────────
export function BreadcrumbForm({ onCreate, projects }) {
  const [note, setNote] = useState("");
  const [who, setWho] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    onCreate({
      note: note.trim(),
      who: who.trim() || undefined,
      source: source.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      projectId: projectId || undefined,
    });

    setNote("");
    setWho("");
    setSource("");
    setSourceUrl("");
    setProjectId("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="breadcrumb-note" className="sr-only">Note</label>
        <input
          id="breadcrumb-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you hear? Quick-capture a breadcrumb…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors"
        >
          Save
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
      >
        {showDetails ? "Less details" : "More details"}
      </button>

      {showDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="breadcrumb-who" className="sr-only">Who was involved</label>
            <input
              id="breadcrumb-who"
              type="text"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Who was involved? e.g. @alice, @bob"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="breadcrumb-source" className="sr-only">Source</label>
            <input
              id="breadcrumb-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Where? e.g. #backend, DM, Jira-123"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="breadcrumb-source-url" className="sr-only">Source link</label>
            <input
              id="breadcrumb-source-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Link (optional)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          {projects?.length > 0 && (
            <div>
              <label htmlFor="breadcrumb-project" className="sr-only">Linked project</label>
              <select
                id="breadcrumb-project"
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
      )}
    </form>
  );
}

// ─── Single breadcrumb card ────────────────────────────────
export function BreadcrumbCard({ breadcrumb, onUpdate, onDelete, projectName }) {
  const { id, note, who, source, sourceUrl, status, createdAt } = breadcrumb;

  const statusStyles = {
    open: "bg-sky-500/20 text-sky-300",
    waiting: "bg-amber-500/20 text-amber-300",
    resolved: "bg-emerald-500/20 text-emerald-300",
  };

  const segments = linkify(note);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
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
          {status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {who && <span>👤 {who}</span>}
        {source && (
          <span>
            📍{" "}
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
        {projectName && <span>📁 {projectName}</span>}
        <span>{timeAgo(createdAt)}</span>
      </div>

      <div className="flex gap-2">
        {status !== "open" && (
          <button
            onClick={() => onUpdate(id, { status: "open" })}
            className="text-xs text-slate-400 hover:text-sky-300 transition-colors"
          >
            Open
          </button>
        )}
        {status !== "waiting" && (
          <button
            onClick={() => onUpdate(id, { status: "waiting" })}
            className="text-xs text-slate-400 hover:text-amber-300 transition-colors"
          >
            Waiting
          </button>
        )}
        {status !== "resolved" && (
          <button
            onClick={() => onUpdate(id, { status: "resolved" })}
            className="text-xs text-slate-400 hover:text-emerald-300 transition-colors"
          >
            Resolved
          </button>
        )}
        <button
          onClick={() => onDelete(id)}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Filterable breadcrumb list ────────────────────────────
const STATUS_TABS = ["all", "open", "waiting", "resolved"];

export function BreadcrumbList({ breadcrumbs, onUpdate, onDelete, projects }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const projectMap = Object.fromEntries(
    (projects || []).map((p) => [p.id, p.name || "Untitled"])
  );

  const filtered = breadcrumbs.filter((b) => {
    if (activeTab !== "all" && b.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [b.note, b.who, b.source]
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
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <label htmlFor="breadcrumb-search" className="sr-only">Search breadcrumbs</label>
          <input
            id="breadcrumb-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search breadcrumbs…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No breadcrumbs found.
          </p>
        ) : (
          filtered.map((b) => (
            <BreadcrumbCard
              key={b.id}
              breadcrumb={b}
              onUpdate={onUpdate}
              onDelete={onDelete}
              projectName={b.projectId ? projectMap[b.projectId] : null}
            />
          ))
        )}
      </div>
    </div>
  );
}
