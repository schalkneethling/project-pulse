import { useEffect, useState, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export function SettingsModal({ onClose, saveTokens, hasNetlifyToken, hasGithubToken }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const [netlifyToken, setNetlifyToken] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const ic =
    "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const updates = {};
    if (netlifyToken) {
      updates.netlifyToken = netlifyToken;
    }
    if (githubToken) {
      updates.githubToken = githubToken;
    }
    const result = await saveTokens(updates);
    setSaving(false);
    if (result?.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(result?.error?.message || "Could not save settings. Please try again.");
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
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
          {hasNetlifyToken && (
            <span className="ml-2 normal-case text-emerald-400 font-normal">✓ Saved</span>
          )}
        </label>
        <input
          id="settings-netlify-token"
          type="password"
          value={netlifyToken}
          onChange={(e) => setNetlifyToken(e.target.value)}
          placeholder="Enter token to save or update"
          className={ic}
        />
        <p className="text-xs text-slate-500 mt-1">
          Used to auto-sync deploy status from Netlify.{" "}
          <a
            href="https://app.netlify.com/user/applications#personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Create a token
          </a>
        </p>
      </div>
      <div>
        <label htmlFor="settings-github-token" className={lc}>
          GitHub Personal Access Token
          {hasGithubToken && (
            <span className="ml-2 normal-case text-emerald-400 font-normal">✓ Saved</span>
          )}
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
          Used to sync PRs, issues, and commit activity from GitHub.{" "}
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Create a token
          </a>
        </p>
      </div>
      {saveError && (
        <p role="alert" className="text-sm text-red-400">
          {saveError}
        </p>
      )}
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
