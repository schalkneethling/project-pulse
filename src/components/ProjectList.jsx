import { useState } from "react";
import { visibleProjects, archivedProjects } from "../lib/workItems";
import { StatusBadge, DeployBadge, GitHubBadge, Stale } from "./ui/ProjectBadges";

export function ProjectList({ projects, onSelect }) {
  const [showArchived, setShowArchived] = useState(false);

  const active = visibleProjects(projects);
  const archived = archivedProjects(projects);
  const displayed = showArchived ? [...active, ...archived] : active;

  return (
    <div className="space-y-3">
      {displayed.map((p) => {
        const nonArchived = (p.tasks ?? []).filter((t) => !t.archivedAt);
        const done = nonArchived.filter((t) => t.status === "done").length;
        const total = nonArchived.length;
        const isArchived = !!p.archivedAt;

        return (
          <button
            type="button"
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left rounded-xl border p-4 hover:bg-slate-800 transition-colors group ${
              isArchived
                ? "bg-slate-800/30 border-slate-700/30 opacity-70"
                : "bg-slate-800/60 border-slate-700/50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-200 group-hover:text-white truncate">
                  {p.name || "Untitled Project"}
                </h3>
                {p.description && (
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{p.description}</p>
                )}
                {p.nextStep && (
                  <p className="mt-2 text-sm text-slate-500">
                    <span className="text-slate-400 font-medium">Next:</span> {p.nextStep}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {isArchived ? (
                  <span className="text-xs text-slate-500 font-medium">Archived</span>
                ) : (
                  <StatusBadge status={p.status} />
                )}
                <DeployBadge netlify={p.netlify} />
                <GitHubBadge github={p.github} />
                {!isArchived && <Stale project={p} />}
                {total > 0 && (
                  <span className="text-xs text-slate-500">
                    {done}/{total} done
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {archived.length > 0 && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors"
        >
          {showArchived ? "Hide archived" : `Show archived (${archived.length})`}
        </button>
      )}
    </div>
  );
}
