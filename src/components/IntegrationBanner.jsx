import { useState } from "react";
import { IconSettings } from "./icons";

const STORAGE_KEY = "pulse-dismiss-integration-banner";

export function IntegrationBanner({ hasNetlifyToken, hasGithubToken, projectCount, onOpenSettings }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed || projectCount === 0 || (hasNetlifyToken && hasGithubToken)) {
    return null;
  }

  const missing = [];
  if (!hasNetlifyToken) missing.push("Netlify");
  if (!hasGithubToken) missing.push("GitHub");

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="status"
      className="rounded-xl bg-blue-950/30 border border-blue-900/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">Connect {missing.join(" and ")}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Add API tokens to see deploy failures, PR reviews, and commit activity on your dashboard.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
        >
          <IconSettings size={14} />
          Open settings
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
