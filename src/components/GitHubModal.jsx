import { useState, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export function GitHubModal({ github, onSave, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const [owner, setOwner] = useState(github?.owner || "");
  const [repo, setRepo] = useState(github?.repo || "");
  const ic =
    "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = () => {
    if (!owner.trim() || !repo.trim()) {
      return;
    }
    onSave({ owner: owner.trim(), repo: repo.trim() });
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
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4"
    >
      <h2 className="text-lg font-semibold text-slate-200">
        Link GitHub Repo
      </h2>
      <div>
        <label htmlFor="github-owner" className={lc}>
          Owner / Organization
        </label>
        <input
          id="github-owner"
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="e.g. schalkneethling"
          className={ic}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="github-repo" className={lc}>
          Repository
        </label>
        <input
          id="github-repo"
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="e.g. project-pulse"
          className={ic}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!owner.trim() || !repo.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}
