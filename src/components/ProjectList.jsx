import { StatusBadge, DeployBadge, GitHubBadge, Stale } from "./ui/ProjectBadges";

export function ProjectList({ projects, onSelect }) {
  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const tasks = p.tasks ?? [];
        const done = tasks.filter((t) => t.status === "done").length;
        const total = tasks.length;
        return (
          <button
            type="button"
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="w-full text-left rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 hover:bg-slate-800 transition-colors group"
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
                <StatusBadge status={p.status} />
                <DeployBadge netlify={p.netlify} />
                <GitHubBadge github={p.github} />
                <Stale updatedAt={p.updatedAt} />
                {total > 0 && (
                  <span className="text-xs text-slate-500">
                    {done}/{total} tasks
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
