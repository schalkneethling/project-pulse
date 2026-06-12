import { daysSince, fmtDate, lastActivityAt } from "../../lib/helpers";
import { STATUS, DEPLOY_STATUS } from "../../lib/constants";
import { IconClock, IconGithub } from "../icons";

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.active;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`inline-block w-2 h-2 rounded-full ${s.color}`} aria-hidden="true" />
      <span className={s.text}>{s.label}</span>
    </span>
  );
}

export function Stale({ project }) {
  const activityAt = lastActivityAt(project);
  const days = daysSince(activityAt);
  if (days === null || days < 7) return null;
  const label = days >= 30 ? `${Math.floor(days / 30)}mo stale` : `${days}d stale`;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${days >= 14 ? "text-red-400" : "text-amber-400"}`}
      title={`Last activity ${fmtDate(activityAt)}`}
    >
      <IconClock size={12} />
      {label}
    </span>
  );
}

export function DeployBadge({ netlify }) {
  if (!netlify?.lastDeploy) return null;
  const ds = DEPLOY_STATUS[netlify.lastDeploy.state] || DEPLOY_STATUS.none;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ds.color}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${ds.dot}`} aria-hidden="true" />
      {ds.label}
    </span>
  );
}

export function GitHubBadge({ github }) {
  if (!github?.activity) {
    return null;
  }
  const { openPrs, totalIssues } = github.activity;
  if (openPrs === 0 && totalIssues === 0) {
    return null;
  }

  const parts = [];
  if (openPrs > 0) {
    parts.push(`${openPrs} PR${openPrs !== 1 ? "s" : ""}`);
  }
  if (totalIssues > 0) {
    parts.push(`${totalIssues} issue${totalIssues !== 1 ? "s" : ""}`);
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <IconGithub size={11} />
      {parts.join(" · ")}
    </span>
  );
}

export function TypeBadge({ type }) {
  const styles =
    type === "task"
      ? "bg-slate-700/60 text-slate-400"
      : "bg-sky-950/40 text-sky-400 border border-sky-900/30";
  const label = type === "task" ? "Task" : "Follow-up";
  return (
    <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${styles}`}>
      {label}
    </span>
  );
}
