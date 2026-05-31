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

export function TodoBoard({ todos, onUpdate, onDelete, projects }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const projectMap = Object.fromEntries((projects || []).map((p) => [p.id, p.name || "Untitled"]));

  const q = search.trim().toLowerCase();
  const filtered = q
    ? todos.filter((t) =>
        [t.note, t.who, t.source].filter(Boolean).join(" ").toLowerCase().includes(q),
      )
    : todos;

  const columns = Object.fromEntries(STATUS_ORDER.map((s) => [s, []]));
  for (const t of filtered) {
    (columns[t.status] || columns.backlog).push(t);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="todo-search" className="sr-only">
          Search todos
        </label>
        <input
          id="todo-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search todos..."
          aria-label="Search todos"
          className="flex-1 max-w-md bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <span className="text-xs text-slate-500">{filtered.length} todos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {STATUS_ORDER.map((status) => {
          const items = columns[status];
          const meta = STATUS_META[status];
          const isOver = dragOver === status;
          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOver !== status) setDragOver(status);
              }}
              onDragLeave={() => {
                if (dragOver === status) setDragOver(null);
              }}
              onDrop={(e) => handleDrop(e, status)}
              className={`rounded-xl border ${COLUMN_TINT[status]} bg-slate-900/40 p-3 min-h-[60vh] transition-colors ${isOver ? "ring-2 ring-sky-500/60 bg-slate-900/70" : ""}`}
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
                  items.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onEdit={setEditing}
                      projectName={todo.projectId ? projectMap[todo.projectId] : null}
                      draggable
                      compact
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

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
