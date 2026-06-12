import { useState } from "react";

export function ProjectActions({
  projectName,
  isArchived,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isArchived) {
    return (
      <div className="border-t border-slate-800 pt-6">
        <button
          type="button"
          onClick={onUnarchive}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-200 transition-colors"
        >
          Unarchive project
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 pt-6 space-y-3">
      {confirmingArchive ? (
        <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
          <p className="text-sm text-slate-300 flex-1">
            Archive &ldquo;{projectName || "this project"}&rdquo;? It will be hidden from your overview
            and project list.
          </p>
          <button
            type="button"
            onClick={() => {
              onArchive();
              setConfirmingArchive(false);
            }}
            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={() => setConfirmingArchive(false)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingArchive(true)}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Archive project
        </button>
      )}

      {confirmingDelete ? (
        <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/40 rounded-lg p-4">
          <p className="text-sm text-red-300 flex-1">
            Permanently delete &ldquo;{projectName || "this project"}&rdquo;?
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Delete project
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="text-sm text-slate-600 hover:text-red-400 transition-colors"
        >
          Delete project
        </button>
      )}
    </div>
  );
}
