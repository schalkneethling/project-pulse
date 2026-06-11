import { useState } from "react";
import { TodoCard, STATUS_ORDER, STATUS_META } from "./TodoCard";

const STATUS_TABS = [
  ["all", "All"],
  ...STATUS_ORDER.map((s) => [s, STATUS_META[s].label]),
];

export function TodoList({ todos, onUpdate, onDelete, projects }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const projectMap = Object.fromEntries((projects || []).map((p) => [p.id, p.name || "Untitled"]));

  const filtered = todos.filter((todo) => {
    if (activeTab !== "all" && todo.status !== activeTab) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const haystack = [todo.note, todo.who, todo.source].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 flex-wrap">
          {STATUS_TABS.map(([tab, label]) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
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
          <label htmlFor="todo-list-search" className="sr-only">
            Search follow-ups
          </label>
          <input
            id="todo-list-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search follow-ups..."
            aria-label="Search follow-ups"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No follow-ups found.</p>
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
