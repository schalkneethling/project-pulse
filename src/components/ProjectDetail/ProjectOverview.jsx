import { STATUS, DEPLOY_STATUS } from "../../lib/constants";
import { activeWorkItems } from "../../lib/workItems";
import { daysSince } from "../../lib/helpers";
import { StatusBadge } from "../ui/ProjectBadges";
import { ProjectHeader } from "./ProjectHeader";

export function ProjectOverview({
  project,
  editingField,
  tempValue,
  returnLabel,
  onBack,
  onTempChange,
  onStartEdit,
  onCommit,
  onKeyDown,
  onStatusChange,
  inputRef,
}) {
  const work = activeWorkItems(project.tasks);
  const counts = {
    next: work.filter((t) => t.status === "todo").length,
    active: work.filter((t) => t.status === "in_progress").length,
    blocked: work.filter((t) => t.status === "blocked").length,
  };

  const deployState = project.netlify?.lastDeploy?.state;
  const deployMeta = deployState ? DEPLOY_STATUS[deployState] : null;

  const gh = project.github?.activity;
  const ghParts = [];
  if (gh?.reviewRequestedPrs > 0) {
    ghParts.push(`${gh.reviewRequestedPrs} PR${gh.reviewRequestedPrs !== 1 ? "s" : ""} awaiting review`);
  }
  if (gh?.assignedIssues > 0) {
    ghParts.push(`${gh.assignedIssues} assigned issue${gh.assignedIssues !== 1 ? "s" : ""}`);
  }
  if (gh?.latestCommitAt) {
    const d = daysSince(gh.latestCommitAt);
    if (d !== null) {
      ghParts.push(`Last commit ${d === 0 ? "today" : `${d}d ago`}`);
    }
  }

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
      <div className="p-5 space-y-4">
        <ProjectHeader
          project={project}
          editing={editingField === "name"}
          tempValue={tempValue}
          returnLabel={returnLabel}
          onBack={onBack}
          onTempChange={onTempChange}
          onStartEdit={() => onStartEdit("name", project.name)}
          onCommit={() => onCommit("name")}
          onKeyDown={(e) => onKeyDown(e, "name")}
          inputRef={inputRef}
        />

        <div>
          <span className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Status</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project status">
            {Object.entries(STATUS).map(([k, v]) => (
              <button
                type="button"
                key={k}
                onClick={() => onStatusChange(k)}
                role="radio"
                aria-checked={project.status === k}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${project.status === k ? `${v.color} text-white` : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Next", count: counts.next, color: "text-slate-300" },
            { label: "Active", count: counts.active, color: "text-blue-400" },
            { label: "Blocked", count: counts.blocked, color: "text-red-400" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="rounded-lg bg-slate-900/40 border border-slate-700/50 p-3 text-center"
            >
              <p className={`text-xl font-bold ${chip.color}`}>{chip.count}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{chip.label}</p>
            </div>
          ))}
        </div>

        {(deployMeta || ghParts.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            {deployMeta && (
              <span className="inline-flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${deployMeta.dot}`} />
                Deploy: {deployMeta.label}
              </span>
            )}
            {ghParts.length > 0 && <span>GitHub: {ghParts.join(" · ")}</span>}
          </div>
        )}

        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
        </div>
      </div>
    </div>
  );
}
