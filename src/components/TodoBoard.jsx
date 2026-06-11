import { useState } from "react";
import { TodoCard, STATUS_META, STATUS_ORDER } from "./TodoCard";
import { TodoEditModal } from "./TodoEditModal";

const COLUMN_TINT = {
  backlog: "border-slate-700/50",
  ready: "border-sky-700/40",
  in_progress: "border-blue-700/40",
  on_hold: "border-amber-700/40",
  done: "border-emerald-700/40",
};

const LAYOUTS = [
  ["columns", "Columns"],
  ["lanes", "Lanes"],
];

export function TodoBoard({ todos, onUpdate, onDelete, projects }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [layout, setLayout] = useState("columns");

  const projectMap = Object.fromEntries(
    (projects || []).map((p) => [p.id, p.name || "Untitled"]),
  );

  const q = search.trim().toLowerCase();
  const filtered = q
    ? todos.filter((t) =>
        [t.note, t.who, t.source].filter(Boolean).join(" ").toLowerCase().includes(q),
      )
    : todos;

  const lanes = Object.fromEntries(STATUS_ORDER.map((s) => [s, []]));
  for (const t of filtered) {
    (lanes[t.status] || lanes.backlog).push(t);
  }

  const handleDrop = (e, status) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const todo = todos.find((t) => t.id === id);
    if (todo && todo.status !== status) {
      onUpdate(id, { status });
    }
  };

  const dragHandlers = (status) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOver !== status) setDragOver(status);
    },
    onDragLeave: () => {
      if (dragOver === status) setDragOver(null);
    },
    onDrop: (e) => handleDrop(e, status),
  });

  const renderCard = (todo) => (
    <TodoCard
      todo={todo}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onEdit={setEditing}
      projectName={todo.projectId ? projectMap[todo.projectId] : null}
      draggable
      compact
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="todo-search" className="sr-only">
          Search follow-ups
        </label>
        <input
          id="todo-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
            placeholder="Search follow-ups..."
            aria-label="Search follow-ups"
          className="flex-1 max-w-md bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div
          role="group"
          aria-label="Board layout"
          className="inline-flex rounded-lg border border-slate-700 bg-slate-800 p-0.5 text-xs"
        >
          {LAYOUTS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLayout(value)}
              aria-pressed={layout === value}
              className={`px-3 py-1 rounded-md transition-colors ${
                layout === value
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{filtered.length} follow-ups</span>
      </div>

      {layout === "columns" ? (
        <div className="grid gap-4 max-md:grid-cols-1 md:max-xl:grid-cols-2 xl:grid-cols-5">
          {STATUS_ORDER.map((status) => {
            const items = lanes[status];
            const meta = STATUS_META[status];
            const isOver = dragOver === status;
            return (
              <section
                key={status}
                {...dragHandlers(status)}
                className={`rounded-xl border ${COLUMN_TINT[status]} bg-slate-900/40 p-3 min-h-[60vh] transition-colors ${isOver ? "ring-2 ring-blue-500/60 bg-slate-900/70" : ""}`}
                aria-label={`${meta.label} column`}
              >
                <header className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold text-slate-200">{meta.label}</h3>
                  <span className="text-xs text-slate-500">{items.length}</span>
                </header>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-6 border border-dashed border-slate-800 rounded-lg">
                      Drop todos here
                    </p>
                  ) : (
                    items.map((todo) => <div key={todo.id}>{renderCard(todo)}</div>)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {STATUS_ORDER.map((status) => {
            const items = lanes[status];
            const meta = STATUS_META[status];
            const isOver = dragOver === status;
            return (
              <section
                key={status}
                {...dragHandlers(status)}
                className={`rounded-xl border ${COLUMN_TINT[status]} bg-slate-900/40 transition-colors ${isOver ? "ring-2 ring-blue-500/60 bg-slate-900/70" : ""}`}
                aria-label={`${meta.label} lane`}
              >
                <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2 bg-slate-900/90 backdrop-blur rounded-t-xl border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-200">{meta.label}</h3>
                  <span className="text-xs text-slate-500">{items.length}</span>
                </header>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-6 mx-3 my-3 border border-dashed border-slate-800 rounded-lg">
                    Drop todos here
                  </p>
                ) : (
                  <div
                    className="flex items-stretch gap-3 overflow-x-auto p-3 snap-x snap-mandatory"
                    style={{ scrollbarColor: "rgb(51 65 85) transparent" }}
                  >
                    <span
                      className={`sticky left-0 z-[1] self-center shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full ${meta.pill}`}
                      aria-hidden="true"
                    >
                      {meta.label}
                    </span>
                    {items.map((todo) => (
                      <div
                        key={todo.id}
                        className="snap-start shrink-0 max-sm:w-72 sm:w-80"
                      >
                        {renderCard(todo)}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <TodoEditModal
          todo={editing}
          projects={projects}
          onSave={async (updates) => {
            await onUpdate(editing.id, updates);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
