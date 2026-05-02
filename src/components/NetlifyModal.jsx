import { useState, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";

export function NetlifyModal({ netlify, onSave, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);

  const [form, setForm] = useState({
    siteId: netlify?.siteId || "",
    siteName: netlify?.siteName || "",
    url: netlify?.url || "",
    state: netlify?.lastDeploy?.state || "ready",
    branch: netlify?.lastDeploy?.branch || "main",
    commitMessage: netlify?.lastDeploy?.commitMessage || "",
    deployTime: netlify?.lastDeploy?.deployTime || "",
    errorMessage: netlify?.lastDeploy?.errorMessage || "",
  });
  const ic =
    "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-xs text-slate-400 uppercase tracking-wider mb-1";

  const handleSave = () => {
    if (!form.siteName.trim()) {
      return;
    }
    onSave({
      siteId: form.siteId.trim(),
      siteName: form.siteName.trim(),
      url: form.url.trim(),
      lastDeploy: {
        state: form.state,
        createdAt: new Date().toISOString(),
        publishedAt: form.state === "ready" ? new Date().toISOString() : null,
        deployTime: form.deployTime ? parseInt(form.deployTime, 10) : null,
        errorMessage: form.state === "error" ? form.errorMessage.trim() : null,
        branch: form.branch.trim() || "main",
        commitMessage: form.commitMessage.trim() || null,
      },
    });
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
      <h2 className="text-lg font-semibold text-slate-200">Link Netlify Site</h2>
      <p className="text-xs text-slate-400">
        Link a Netlify site to track deploy status. Add your API token in Settings to enable
        auto-sync.
      </p>
      <div>
        <label htmlFor="netlify-site-name" className={lc}>
          Site name
        </label>
        <input
          id="netlify-site-name"
          type="text"
          value={form.siteName}
          onChange={(e) => setForm({ ...form, siteName: e.target.value })}
          placeholder="my-awesome-site"
          className={ic}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="netlify-site-url" className={lc}>
          Site URL
        </label>
        <input
          id="netlify-site-url"
          type="url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://my-awesome-site.netlify.app"
          className={ic}
        />
      </div>
      <div>
        <label htmlFor="netlify-site-id" className={lc}>
          Netlify Site ID (for future API sync)
        </label>
        <input
          id="netlify-site-id"
          type="text"
          value={form.siteId}
          onChange={(e) => setForm({ ...form, siteId: e.target.value })}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={ic}
        />
      </div>
      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Latest Deploy Status</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="netlify-deploy-status" className={lc}>
              Status
            </label>
            <select
              id="netlify-deploy-status"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={ic}
            >
              <option value="ready">Published</option>
              <option value="building">Building</option>
              <option value="enqueued">Queued</option>
              <option value="error">Failed</option>
            </select>
          </div>
          <div>
            <label htmlFor="netlify-deploy-branch" className={lc}>
              Branch
            </label>
            <input
              id="netlify-deploy-branch"
              type="text"
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              placeholder="main"
              className={ic}
            />
          </div>
          <div>
            <label htmlFor="netlify-deploy-commit" className={lc}>
              Last commit message
            </label>
            <input
              id="netlify-deploy-commit"
              type="text"
              value={form.commitMessage}
              onChange={(e) => setForm({ ...form, commitMessage: e.target.value })}
              placeholder="fix: update header styles"
              className={ic}
            />
          </div>
          <div>
            <label htmlFor="netlify-deploy-time" className={lc}>
              Build time (seconds)
            </label>
            <input
              id="netlify-deploy-time"
              type="number"
              value={form.deployTime}
              onChange={(e) => setForm({ ...form, deployTime: e.target.value })}
              placeholder="120"
              className={ic}
            />
          </div>
          {form.state === "error" && (
            <div>
              <label htmlFor="netlify-deploy-error" className={lc}>
                Error message
              </label>
              <textarea
                id="netlify-deploy-error"
                value={form.errorMessage}
                onChange={(e) => setForm({ ...form, errorMessage: e.target.value })}
                placeholder="Build failed: ..."
                rows={2}
                className={ic + " resize-none"}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!form.siteName.trim()}
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
