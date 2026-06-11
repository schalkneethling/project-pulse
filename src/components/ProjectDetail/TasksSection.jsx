import { useState } from "react";
import { TASK_STATUS } from "../../lib/constants";
import { IconPlus, IconCheck, IconTrash } from "../icons";

export function TasksSection({
  project,
  groups,
  groupBorders,
  newTask,
  onNewTaskChange,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const [confirmingId, setConfirmingId] = useState(null);

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-200 mb-1">Project tasks</h3>
      <p className="text-xs text-slate-500 mb-4">
        Work items scoped to this project — distinct from global follow-ups
      </p>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => onNewTaskChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAddTask();
          }}
          placeholder="Add a task…"
          aria-label="New task title"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onAddTask}
          disabled={!newTask.trim()}
          aria-label="Add task"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
        >
          <IconPlus size={18} />
        </button>
      </div>
      {Object.entries(groups).map(([status, tasks]) => {
        if (!tasks.length) {
          return null;
        }
        return (
          <div key={status} className="mb-4">
            <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              {TASK_STATUS[status]} <span className="text-slate-500">({tasks.length})</span>
            </h4>
            <div className="space-y-1">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg bg-slate-800/40 border ${groupBorders[status]} p-3 group`}
                >
                  {status === "done" ? (
                    <span className="text-emerald-500 shrink-0">
                      <IconCheck />
                    </span>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <span
                    className={`flex-1 text-sm ${status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}
                  >
                    {t.title}
                  </span>
                  {confirmingId === t.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">Delete?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteTask(t.id);
                          setConfirmingId(null);
                        }}
                        className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <select
                        value={t.status}
                        onChange={(e) => onUpdateTask(t.id, { status: e.target.value })}
                        aria-label={`Status for ${t.title}`}
                        className="bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                      >
                        {Object.entries(TASK_STATUS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(t.id)}
                        aria-label={`Delete ${t.title}`}
                        className="text-slate-600 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all shrink-0"
                      >
                        <IconTrash size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {project.tasks.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">No tasks yet. Add one above.</p>
      )}
    </section>
  );
}
