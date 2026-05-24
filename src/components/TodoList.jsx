import { useState } from "react";
import { TodoCard } from "./TodoCard";

const STATUS_TABS = [
  ["all", "all"],
  ["open", "open"],
  ["waiting", "waiting"],
  ["resolved", "done"],
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
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No todos found.</p>
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
