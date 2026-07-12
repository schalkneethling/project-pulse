import { useEffect, useReducer, useRef, useState } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { WORK_STATUS, WORK_STATUS_ORDER } from "../../lib/constants";
import { safeHttpUrl } from "../../lib/linkify";

const FIELDS = ["title", "description", "who", "source", "sourceUrl", "dueDate", "status"];

function init(item) {
  return {
    title: item.title ?? "",
    description: item.description ?? "",
    who: item.who ?? "",
    source: item.source ?? "",
    sourceUrl: item.sourceUrl ?? "",
    dueDate: item.dueDate ?? "",
    status: item.status ?? "todo",
  };
}

function reducer(state, action) {
  if (action.type === "SET") {
    return { ...state, [action.field]: action.value };
  }
  return state;
}

export function WorkItemEditModal({ item, onSave, onClose }) {
  const [form, dispatch] = useReducer(reducer, item, init);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  useFocusTrap(containerRef);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;

    const normalizedSourceUrl = safeHttpUrl(form.sourceUrl);
    if (form.sourceUrl.trim() && !normalizedSourceUrl) {
      setError("Source link must be a valid http or https URL.");
      return;
    }

    const updates = {};
    for (const f of FIELDS) {
      const current = item[f] ?? (f === "status" ? "todo" : "");
      const next =
        f === "title"
          ? form.title.trim()
          : f === "sourceUrl"
            ? normalizedSourceUrl
            : form[f];
      const normalized = next === "" ? null : next;
      const normalizedCurrent = current === "" ? null : current;
      if (normalized !== normalizedCurrent) {
        updates[f] = normalized;
      }
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(updates);
    } catch (err) {
      setError(err?.message || "Could not save work item.");
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-edit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4"
      >
        <header className="flex items-center justify-between">
          <h2 id="work-edit-title" className="text-lg font-semibold text-slate-100">
            Edit work item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="edit-title" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              Title
            </label>
            <textarea
              id="edit-title"
              rows={2}
              value={form.title}
              onChange={(e) => dispatch({ type: "SET", field: "title", value: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={form.description}
              onChange={(e) => dispatch({ type: "SET", field: "description", value: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-status" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Status
              </label>
              <select
                id="edit-status"
                value={form.status}
                onChange={(e) => dispatch({ type: "SET", field: "status", value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORK_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {WORK_STATUS[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-due" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Due date
              </label>
              <input
                id="edit-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => dispatch({ type: "SET", field: "dueDate", value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="edit-who" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Who
              </label>
              <input
                id="edit-who"
                type="text"
                value={form.who}
                onChange={(e) => dispatch({ type: "SET", field: "who", value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="edit-source" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Source
              </label>
              <input
                id="edit-source"
                type="text"
                value={form.source}
                onChange={(e) => dispatch({ type: "SET", field: "source", value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="edit-source-url" className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Source link
              </label>
              <input
                id="edit-source-url"
                type="url"
                value={form.sourceUrl}
                onChange={(e) => dispatch({ type: "SET", field: "sourceUrl", value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
