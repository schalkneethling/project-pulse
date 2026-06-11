import { fmtDateTime, fmtDuration, timeAgo } from "../../lib/helpers";
import { DEPLOY_STATUS } from "../../lib/constants";
import {
  IconRocket,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconGlobe,
  IconExternal,
  IconBranch,
  IconCommit,
} from "../icons";

export function DeployCard({
  netlify,
  onEdit,
  onRemove,
  onSync,
  syncing,
  hasNetlifyToken,
  onOpenSettings,
}) {
  if (!netlify) {
    if (!hasNetlifyToken) {
      return (
        <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center space-y-2">
          <p className="text-sm text-slate-500">Add a Netlify API token in settings to track deploys.</p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open settings
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-2"
      >
        <IconRocket size={18} />
        Link Netlify site
      </button>
    );
  }

  const deploy = netlify.lastDeploy;
  const ds = deploy ? DEPLOY_STATUS[deploy.state] || DEPLOY_STATUS.none : DEPLOY_STATUS.none;

  return (
    <div className={`rounded-xl ${ds.bg} border ${ds.border} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconRocket size={18} />
          <h3 className="text-sm font-semibold text-slate-200">Netlify Deploy</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className={`text-slate-500 hover:text-slate-300 transition-colors ${syncing ? "animate-spin" : ""}`}
            aria-label="Sync Netlify deploys"
          >
            <IconRefresh size={14} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Edit Netlify settings"
          >
            <IconEdit size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-red-400 transition-colors"
            aria-label="Remove Netlify link"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ds.color}`}>
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${ds.dot}`}
              aria-hidden="true"
            />
            {ds.label}
          </span>
          {deploy?.publishedAt && (
            <span className="text-xs text-slate-500">{timeAgo(deploy.publishedAt)}</span>
          )}
        </div>
        {netlify.siteName && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <IconGlobe size={12} />
            <span className="truncate">{netlify.siteName}</span>
            {netlify.url && (
              <a
                href={netlify.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 shrink-0"
              >
                <IconExternal size={12} />
              </a>
            )}
          </div>
        )}
        {deploy?.branch && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <IconBranch size={12} />
            <span>{deploy.branch}</span>
          </div>
        )}
        {deploy?.commitMessage && (
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <span className="shrink-0 mt-0.5">
              <IconCommit size={12} />
            </span>
            <span className="line-clamp-2">{deploy.commitMessage}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
          {deploy?.deployTime && <span>Built in {fmtDuration(deploy.deployTime)}</span>}
          {deploy?.createdAt && <span>{fmtDateTime(deploy.createdAt)}</span>}
        </div>
        {deploy?.errorMessage && (
          <p className="text-xs text-red-400 bg-red-950/40 rounded-lg p-2 mt-1">
            {deploy.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
