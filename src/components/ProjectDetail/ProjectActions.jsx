import { useRef, useState } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const actionButtonClass =
  "px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0";

function ArchiveConfirmDialog({ projectName, onConfirm, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const handleConfirm = () => {
    onConfirm();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={(node) => {
        dialogRef.current = node;
        if (node) {
          node.showModal();
        }
      }}
      onClose={onClose}
      aria-labelledby="archive-project-title"
      className="bg-slate-800 border border-amber-900/40 rounded-2xl p-6 max-w-md w-full space-y-4"
    >
      <h2 id="archive-project-title" className="text-lg font-semibold text-amber-200">
        Archive project
      </h2>
      <p className="text-sm text-amber-200/90">
        Archive &ldquo;{projectName || "this project"}&rdquo;? It will be hidden from your overview
        and project list.
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className={`${actionButtonClass} bg-slate-700 hover:bg-slate-600 text-slate-200`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`${actionButtonClass} bg-amber-700 hover:bg-amber-600 text-white`}
        >
          Archive
        </button>
      </div>
    </dialog>
  );
}

function DeleteConfirmDialog({ projectName, onConfirm, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const handleConfirm = () => {
    onConfirm();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={(node) => {
        dialogRef.current = node;
        if (node) {
          node.showModal();
        }
      }}
      onClose={onClose}
      aria-labelledby="delete-project-title"
      className="bg-slate-800 border border-red-900/40 rounded-2xl p-6 max-w-md w-full space-y-4"
    >
      <h2 id="delete-project-title" className="text-lg font-semibold text-red-300">
        Delete project
      </h2>
      <p className="text-sm text-red-300">
        Permanently delete &ldquo;{projectName || "this project"}&rdquo;? This cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className={`${actionButtonClass} bg-slate-700 hover:bg-slate-600 text-slate-200`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`${actionButtonClass} bg-red-600 hover:bg-red-500 text-white`}
        >
          Delete project
        </button>
      </div>
    </dialog>
  );
}

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
    <div className="border-t border-slate-800 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setConfirmingArchive(true)}
          className={`${actionButtonClass} border border-amber-800/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-700/70 hover:text-amber-200`}
        >
          Archive project
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className={`${actionButtonClass} border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:border-red-700/70 hover:text-red-300`}
        >
          Delete project
        </button>
      </div>

      {confirmingArchive && (
        <ArchiveConfirmDialog
          projectName={projectName}
          onConfirm={onArchive}
          onClose={() => setConfirmingArchive(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteConfirmDialog
          projectName={projectName}
          onConfirm={onDelete}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
