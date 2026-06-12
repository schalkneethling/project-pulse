/**
 * Pure helper / formatting functions used across the app.
 */

const LOCALE = navigator?.languages?.[0] ?? "en-ZA";

export const daysSince = (d) =>
  d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;

/** Latest activity across in-app edits, GitHub commits, and Netlify deploys. */
export function lastActivityAt(project) {
  const candidates = [
    project?.updatedAt,
    project?.github?.activity?.latestCommitAt,
    project?.netlify?.lastDeploy?.publishedAt,
    project?.netlify?.lastDeploy?.createdAt,
  ].filter(Boolean);

  if (candidates.length === 0) return null;

  return candidates.reduce((latest, d) =>
    new Date(d).getTime() > new Date(latest).getTime() ? d : latest,
  );
}

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(LOCALE, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleDateString(LOCALE, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export const fmtDuration = (s) => {
  if (!s) return "";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 > 0 ? `${m}m ${s % 60}s` : `${m}m`;
};

export const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  return days === 1 ? "yesterday" : `${days}d ago`;
};
