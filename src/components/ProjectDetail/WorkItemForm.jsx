import { useReducer, useState } from "react";
import { IconPlus } from "../icons";

const emptyForm = { title: "", who: "", source: "", sourceUrl: "", dueDate: "" };

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return emptyForm;
    default:
      return state;
  }
}

export function WorkItemForm({ onCreate, compact = false }) {
  const [form, dispatch] = useReducer(formReducer, emptyForm);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onCreate({
        title: form.title.trim(),
        who: form.who.trim() || undefined,
        source: form.source.trim() || undefined,
        sourceUrl: form.sourceUrl.trim() || undefined,
        dueDate: form.dueDate || undefined,
      });
      dispatch({ type: "RESET" });
    } catch (err) {
      setSubmitError(err?.message || "Could not save work item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="work-title" className="sr-only">
          Work item
        </label>
        <input
          id="work-title"
          type="text"
          value={form.title}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })}
          placeholder={compact ? "Add work…" : "What needs doing?"}
          aria-label="Work item title"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !form.title.trim()}
          aria-label="Add work item"
          className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium rounded-lg transition-colors"
        >
          <IconPlus size={18} />
        </button>
      </div>
      {submitError && (
        <p role="alert" className="text-sm text-red-400">
          {submitError}
        </p>
      )}

      {!compact && (
        <details className="group">
          <summary className="text-sm text-slate-400 hover:text-slate-300 transition-colors cursor-pointer list-none">
            More details
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label htmlFor="work-who" className="sr-only">
                Who is involved
              </label>
              <input
                id="work-who"
                type="text"
                value={form.who}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "who", value: e.target.value })}
                placeholder="Who? e.g. @alice"
                aria-label="Who is involved"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="work-source" className="sr-only">
                Source
              </label>
              <input
                id="work-source"
                type="text"
                value={form.source}
                onChange={(e) =>
                  dispatch({ type: "SET_FIELD", field: "source", value: e.target.value })
                }
                placeholder="Where? e.g. #backend"
                aria-label="Source"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="work-source-url" className="sr-only">
                Source link
              </label>
              <input
                id="work-source-url"
                type="url"
                value={form.sourceUrl}
                onChange={(e) =>
                  dispatch({ type: "SET_FIELD", field: "sourceUrl", value: e.target.value })
                }
                placeholder="Link (optional)"
                aria-label="Source link"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="work-due-date" className="sr-only">
                Due date
              </label>
              <input
                id="work-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  dispatch({ type: "SET_FIELD", field: "dueDate", value: e.target.value })
                }
                aria-label="Due date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </details>
      )}
    </form>
  );
}
