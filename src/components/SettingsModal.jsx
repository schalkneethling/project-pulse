import { useState, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export function SettingsModal({ onClose, saveTokens }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const [netlifyToken, setNetlifyToken] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ic =
    "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (netlifyToken) {
      updates.netlifyToken = netlifyToken;
    }
    if (githubToken) {
      updates.githubToken = githubToken;
    }
    await saveTokens(updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4"
    >
      <h2 className="text-lg font-semibold text-slate-200">Settings</h2>
      <p className="text-xs text-slate-400">
        API tokens are stored securely and cannot be read back after saving. Enter a new value to
        update.
      </p>
      <div>
        <label htmlFor="settings-netlify-token" className={lc}>
          Netlify Personal Access Token
        </label>
        <input
          id="settings-netlify-token"
          type="password"
          value={netlifyToken}
          onChange={(e) => setNetlifyToken(e.target.value)}
          placeholder="Enter token to save or update"
          className={ic}
          autoFocus
        />
        <p className="text-xs text-slate-500 mt-1">Used to auto-sync deploy status from Netlify.</p>
      </div>
      <div>
        <label htmlFor="settings-github-token" className={lc}>
          GitHub Personal Access Token
        </label>
        <input
          id="settings-github-token"
          type="password"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="Enter token to save or update"
          className={ic}
        />
        <p className="text-xs text-slate-500 mt-1">
          Used to sync PRs, issues, and commit activity from GitHub.
        </p>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (!netlifyToken && !githubToken)}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
