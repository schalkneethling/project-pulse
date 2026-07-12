import { fmtDate, timeAgo } from "../../lib/helpers";
import {
  IconGithub,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconExternal,
  IconCommit,
  IconPR,
  IconIssue,
} from "../icons";

function GitHubItemList({ title, items, icon, fallbackTitle, itemClassName, linkClassName }) {
  if (!items.length) return null;

  return (
    <section
      className="pt-2"
      aria-labelledby={`github-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <h4
        id={`github-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"
      >
        {icon}
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id || item.url || item.number}>
            <article className={`rounded-lg bg-slate-900/50 border ${itemClassName} p-3`}>
              <div className="flex items-start justify-between gap-3">
                <header className="min-w-0">
                  <h5 className="text-sm font-medium text-slate-200 line-clamp-2">
                    {item.title || fallbackTitle}
                  </h5>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.number ? `#${item.number} · ` : ""}Opened {fmtDate(item.openedAt)}
                  </p>
                </header>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${linkClassName}`}
                  >
                    <IconExternal size={12} />
                    View
                  </a>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GitHubCard({
  github,
  onEdit,
  onRemove,
  onSync,
  onSyncIssues,
  syncing,
  syncingIssues,
  hasGithubToken,
  onOpenSettings,
}) {
  if (!github) {
    if (!hasGithubToken) {
      return (
        <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center space-y-2">
          <p className="text-sm text-slate-500">Add a GitHub API token in settings to track PRs and issues.</p>
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
        <IconGithub size={18} />
        Link GitHub repo
      </button>
    );
  }

  const activity = github.activity;
  const reviewRequestedPrDetails = activity?.reviewRequestedPrDetails || [];
  const assignedIssueDetails = activity?.assignedIssueDetails || [];

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconGithub size={18} />
          <h3 className="text-sm font-semibold text-slate-200">GitHub</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className={`text-slate-500 hover:text-slate-300 transition-colors ${syncing ? "animate-spin" : ""}`}
            aria-label="Sync GitHub activity"
          >
            <IconRefresh size={14} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Edit GitHub settings"
          >
            <IconEdit size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-500 hover:text-red-400 transition-colors"
            aria-label="Remove GitHub link"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="truncate">
            {github.owner}/{github.repo}
          </span>
          <a
            href={`https://github.com/${github.owner}/${github.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 shrink-0"
          >
            <IconExternal size={12} />
          </a>
        </div>
        <button
          type="button"
          onClick={onSyncIssues}
          disabled={syncingIssues}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/20 disabled:cursor-wait disabled:opacity-60"
        >
          <IconIssue size={14} />
          {syncingIssues ? "Synchronizing issues…" : "Import / sync issues"}
        </button>
        {activity ? (
          <>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-2 text-center">
                <p className="text-lg font-bold text-blue-400">{activity.openPrs}</p>
                <p className="text-xs text-slate-500">Open PRs</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-2 text-center">
                <p
                  className={`text-lg font-bold ${activity.reviewRequestedPrs > 0 ? "text-amber-400" : "text-slate-400"}`}
                >
                  {activity.reviewRequestedPrs}
                </p>
                <p className="text-xs text-slate-500">Review</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-2 text-center">
                <p
                  className={`text-lg font-bold ${activity.totalIssues > 0 ? "text-red-400" : "text-slate-400"}`}
                >
                  {activity.totalIssues}
                </p>
                <p className="text-xs text-slate-500">Issues</p>
                {activity.assignedIssues > 0 && (
                  <p className="text-xs text-slate-600 leading-tight">
                    {activity.assignedIssues} assigned
                  </p>
                )}
              </div>
            </div>
            <GitHubItemList
              title="Pull Requests Awaiting Review"
              items={reviewRequestedPrDetails}
              icon={<IconPR size={12} />}
              fallbackTitle="Untitled pull request"
              itemClassName="border-amber-900/30"
              linkClassName="bg-amber-600/20 border-amber-500/30 text-amber-200 hover:bg-amber-600/30"
            />
            <GitHubItemList
              title="Assigned Issues"
              items={assignedIssueDetails}
              icon={<IconIssue size={12} />}
              fallbackTitle="Untitled issue"
              itemClassName="border-purple-900/30"
              linkClassName="bg-purple-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30"
            />
            {activity.latestCommitMessage && (
              <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <span className="shrink-0 mt-0.5">
                  <IconCommit size={12} />
                </span>
                <span className="line-clamp-2">{activity.latestCommitMessage}</span>
              </div>
            )}
            {activity.syncedAt && (
              <p className="text-xs text-slate-600">Synced {timeAgo(activity.syncedAt)}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500">No activity data yet. Click refresh to sync.</p>
        )}
      </div>
    </div>
  );
}
