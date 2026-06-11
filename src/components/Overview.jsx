import { useRef } from "react";
import { daysSince } from "../lib/helpers";
import { getDueState, formatDateKey } from "../lib/dueDate";
import { DEPLOY_STATUS } from "../lib/constants";
import {
  IconRocket,
  IconGithub,
  IconAlert,
  IconClock,
  IconPR,
  IconIssue,
} from "./icons";
import { StatusBadge, Stale, DeployBadge, TypeBadge } from "./ui/ProjectBadges";
import { IntegrationBanner } from "./IntegrationBanner";

const STAT_SECTIONS = {
  Active: "section-active",
  Blocked: "section-blocked",
  "In Progress": "section-in-progress",
  "Stale (7d+)": "section-stale",
};

export function Overview({
  projects,
  todos,
  onSelect,
  onSelectFollowUp,
  onNewProject,
  hasNetlifyToken,
  hasGithubToken,
  onOpenSettings,
}) {
  const sectionRefs = useRef({});

  const active = projects.filter((p) => p.status === "active");
  const blocked = projects.filter((p) => p.status === "blocked");
  const stale = projects.filter((p) => p.status === "active" && daysSince(p.updatedAt) >= 7);

  const tasksWithProject = projects.flatMap((p) =>
    (p.tasks ?? []).map((t) => ({ ...t, pName: p.name, pId: p.id })),
  );
  const blockedTasks = tasksWithProject.filter((t) => t.status === "blocked");
  const inProgress = tasksWithProject.filter((t) => t.status === "in_progress");

  const nextSteps = projects.filter(
    (p) => p.nextStep && (p.status === "active" || p.status === "blocked"),
  );
  const deployAlerts = projects.filter((p) => {
    const s = p.netlify?.lastDeploy?.state;
    return s === "error" || s === "building";
  });
  const reviewPRs = projects.filter((p) => p.github?.activity?.reviewRequestedPrs > 0);
  const assignedIssues = projects.filter((p) => p.github?.activity?.assignedIssues > 0);
  const ghStale = projects.filter((p) => {
    if (!p.github?.activity?.latestCommitAt || p.status !== "active") return false;
    return daysSince(p.github.activity.latestCommitAt) >= 7;
  });

  const staleProjects = [...new Map([...stale, ...ghStale].map((p) => [p.id, p])).values()];

  const dueSoon = (todos || [])
    .filter((t) => isDueSoonTodo(t))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));

  const hasUrgentSections =
    deployAlerts.length > 0 ||
    reviewPRs.length > 0 ||
    assignedIssues.length > 0 ||
    blocked.length > 0 ||
    blockedTasks.length > 0 ||
    dueSoon.length > 0;

  const scrollToSection = (sectionId) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const statCards = [
    { l: "Active", v: active.length, c: "text-emerald-400", section: STAT_SECTIONS.Active },
    { l: "Blocked", v: blocked.length + blockedTasks.length, c: "text-red-400", section: STAT_SECTIONS.Blocked },
    { l: "In Progress", v: inProgress.length, c: "text-blue-400", section: STAT_SECTIONS["In Progress"] },
    {
      l: "Stale (7d+)",
      v: staleProjects.length,
      c: "text-amber-400",
      section: STAT_SECTIONS["Stale (7d+)"],
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Project Pulse</h1>
        <p className="mt-1 text-slate-400">What needs your attention right now</p>
      </header>

      <IntegrationBanner
        hasNetlifyToken={hasNetlifyToken}
        hasGithubToken={hasGithubToken}
        projectCount={projects.length}
        onOpenSettings={onOpenSettings}
      />

      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((x) => (
            <button
              type="button"
              key={x.l}
              onClick={() => x.section && scrollToSection(x.section)}
              disabled={x.v === 0}
              className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 text-left hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-default disabled:hover:bg-slate-800/60"
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider">{x.l}</p>
              <p className={`mt-1 text-2xl font-bold ${x.c}`}>{x.v}</p>
            </button>
          ))}
        </div>
      )}

      {deployAlerts.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200 mb-1">
            <IconRocket size={20} />
            Deploy Alerts
          </h2>
          <p className="text-xs text-slate-500 mb-3">Failed or in-progress deploys that need attention</p>
          <div className="space-y-2">
            {deployAlerts.map((p) => {
              const ds = DEPLOY_STATUS[p.netlify.lastDeploy.state];
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`w-full text-left rounded-lg ${ds.bg} border ${ds.border} p-3 hover:brightness-125 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{p.name}</span>
                    <DeployBadge netlify={p.netlify} />
                  </div>
                  {p.netlify.lastDeploy.errorMessage && (
                    <p className="mt-1 text-xs text-red-400 truncate">
                      {p.netlify.lastDeploy.errorMessage}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {(reviewPRs.length > 0 || assignedIssues.length > 0) && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200 mb-1">
            <IconGithub size={20} />
            GitHub Activity
          </h2>
          <p className="text-xs text-slate-500 mb-3">Pull requests and issues waiting on you</p>
          <div className="space-y-2">
            {reviewPRs.map((p) => (
              <button
                type="button"
                key={`pr-${p.id}`}
                onClick={() => onSelect(p.id)}
                className="w-full text-left rounded-lg bg-amber-950/20 border border-amber-900/30 p-3 hover:bg-amber-950/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <IconPR size={12} />
                    {p.github.activity.reviewRequestedPrs} PR
                    {p.github.activity.reviewRequestedPrs !== 1 ? "s" : ""} awaiting review
                  </span>
                </div>
              </button>
            ))}
            {assignedIssues.map((p) => (
              <button
                type="button"
                key={`iss-${p.id}`}
                onClick={() => onSelect(p.id)}
                className="w-full text-left rounded-lg bg-purple-950/20 border border-purple-900/30 p-3 hover:bg-purple-950/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    <IconIssue size={12} />
                    {p.github.activity.assignedIssues} assigned issue
                    {p.github.activity.assignedIssues !== 1 ? "s" : ""}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {(blocked.length > 0 || blockedTasks.length > 0) && (
        <section
          ref={(el) => {
            sectionRefs.current[STAT_SECTIONS.Blocked] = el;
          }}
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-1">
            <IconAlert size={20} />
            Blocked on You
          </h2>
          <p className="text-xs text-slate-500 mb-3">Projects and tasks that cannot move forward</p>
          <div className="space-y-2">
            {blocked.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full text-left rounded-lg bg-red-950/30 border border-red-900/40 p-3 hover:bg-red-950/50 transition-colors"
              >
                <span className="font-medium text-slate-200">{p.name}</span>
                {p.nextStep && <p className="mt-1 text-sm text-slate-400">Next: {p.nextStep}</p>}
              </button>
            ))}
            {blockedTasks.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => onSelect(t.pId)}
                className="w-full text-left rounded-lg bg-red-950/20 border border-red-900/30 p-3 hover:bg-red-950/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{t.pName}</span>
                  <TypeBadge type="task" />
                </div>
                <p className="font-medium text-slate-200">{t.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {dueSoon.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-yellow-400 mb-1">
            <IconClock size={20} />
            Due Today / Overdue
          </h2>
          <p className="text-xs text-slate-500 mb-3">Follow-ups with due dates that need action</p>
          <div className="space-y-2">
            {dueSoon.map((t) => {
              const dueState = getDueState(t.dueDate, t.status);
              const project = projects.find((p) => p.id === t.projectId);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => (t.projectId ? onSelect(t.projectId) : onSelectFollowUp?.())}
                  className={`w-full text-left rounded-lg border p-3 hover:brightness-110 transition-all ${
                    dueState === "late"
                      ? "bg-red-950/30 border-red-900/40"
                      : "bg-yellow-950/20 border-yellow-900/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {project && <span className="text-sm text-slate-400">{project.name}</span>}
                    <TypeBadge type="follow-up" />
                    <span
                      className={`ml-auto text-xs ${dueState === "late" ? "text-red-400" : "text-yellow-400"}`}
                    >
                      {dueState === "late" ? "Overdue" : "Due today"} · {formatDateKey(t.dueDate)}
                    </span>
                  </div>
                  <p className="font-medium text-slate-200 mt-1">{t.note}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {nextSteps.length > 0 && (
        <section
          ref={(el) => {
            sectionRefs.current[STAT_SECTIONS.Active] = el;
          }}
        >
          <h2 className="text-lg font-semibold text-slate-200 mb-1">Next Steps</h2>
          <p className="text-xs text-slate-500 mb-3">Where to pick up when you sit down with each project</p>
          <div className="space-y-2">
            {nextSteps.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full text-left rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={p.status} />
                    <Stale updatedAt={p.updatedAt} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-400">{p.nextStep}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {inProgress.length > 0 && (
        <section
          ref={(el) => {
            sectionRefs.current[STAT_SECTIONS["In Progress"]] = el;
          }}
        >
          <h2 className="text-lg font-semibold text-blue-400 mb-1">Currently In Progress</h2>
          <p className="text-xs text-slate-500 mb-3">Project tasks you have already started</p>
          <div className="space-y-2">
            {inProgress.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => onSelect(t.pId)}
                className="w-full text-left rounded-lg bg-blue-950/20 border border-blue-900/30 p-3 hover:bg-blue-950/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{t.pName}</span>
                  <TypeBadge type="task" />
                </div>
                <p className="font-medium text-slate-200">{t.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {staleProjects.length > 0 && (
        <section
          ref={(el) => {
            sectionRefs.current[STAT_SECTIONS["Stale (7d+)"]] = el;
          }}
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-400 mb-1">
            <IconClock size={20} />
            Needs a Nudge
          </h2>
          <p className="text-xs text-slate-500 mb-3">Active projects with no updates or commits in 7+ days</p>
          <div className="space-y-2">
            {staleProjects.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="w-full text-left rounded-lg bg-amber-950/20 border border-amber-900/30 p-3 hover:bg-amber-950/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <Stale updatedAt={p.updatedAt} />
                </div>
                {p.nextStep && <p className="mt-1 text-sm text-slate-400">Next: {p.nextStep}</p>}
              </button>
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">No projects yet</p>
          <p className="mt-1 text-sm">Add your first project to get started</p>
          {onNewProject && (
            <button
              type="button"
              onClick={onNewProject}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Add your first project
            </button>
          )}
        </div>
      )}

      {projects.length > 0 && !hasUrgentSections && nextSteps.length === 0 && inProgress.length === 0 && staleProjects.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <p className="text-lg text-emerald-400 font-medium">All clear</p>
          <p className="mt-1 text-sm text-slate-400">
            Nothing urgent — pick a next step from your active projects or add one in project detail.
          </p>
        </div>
      )}

      {projects.length > 0 && !hasUrgentSections && (nextSteps.length > 0 || inProgress.length > 0) && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No urgent alerts — you are caught up on deploys, GitHub, and blockers.
        </div>
      )}
    </div>
  );
}

function isDueSoonTodo(todo) {
  const state = getDueState(todo.dueDate, todo.status);
  return state === "today" || state === "late";
}
