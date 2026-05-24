import { useReducer } from "react";

const formInitial = { note: "", who: "", source: "", sourceUrl: "", projectId: "", dueDate: "" };

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return formInitial;
    default:
      return state;
  }
}

export function TodoForm({ onCreate, projects }) {
  const [form, dispatch] = useReducer(formReducer, formInitial);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.note.trim()) {
      return;
    }

    onCreate({
      note: form.note.trim(),
      who: form.who.trim() || undefined,
      source: form.source.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      projectId: form.projectId || undefined,
      dueDate: form.dueDate || undefined,
    });

    dispatch({ type: "RESET" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="todo-note" className="sr-only">
          Todo
        </label>
        <input
          id="todo-note"
          type="text"
          value={form.note}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "note", value: e.target.value })}
          placeholder="Add a todo..."
          aria-label="Todo note"
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
            <label htmlFor="todo-who" className="sr-only">
              Who is involved
            </label>
            <input
              id="todo-who"
              type="text"
              value={form.who}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "who", value: e.target.value })}
              placeholder="Who is involved? e.g. @alice, @bob"
              aria-label="Who is involved"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="todo-source" className="sr-only">
              Source
            </label>
            <input
              id="todo-source"
              type="text"
              value={form.source}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "source", value: e.target.value })
              }
              placeholder="Where? e.g. #backend, DM, Jira-123"
              aria-label="Source"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="todo-source-url" className="sr-only">
              Source link
            </label>
            <input
              id="todo-source-url"
              type="url"
              value={form.sourceUrl}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "sourceUrl", value: e.target.value })
              }
              placeholder="Link (optional)"
              aria-label="Source link"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div>
            <label htmlFor="todo-due-date" className="sr-only">
              Due date
            </label>
            <input
              id="todo-due-date"
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "dueDate", value: e.target.value })
              }
              aria-label="Due date"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          {projects?.length > 0 && (
            <div>
              <label htmlFor="todo-project" className="sr-only">
                Linked project
              </label>
              <select
                id="todo-project"
                value={form.projectId}
                onChange={(e) =>
                  dispatch({ type: "SET_FIELD", field: "projectId", value: e.target.value })
                }
                aria-label="Linked project"
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
