/** Projects visible in overview and default project list. */
export function visibleProjects(projects) {
  return projects.filter((p) => !p.archivedAt);
}

export function archivedProjects(projects) {
  return projects.filter((p) => p.archivedAt);
}

/** Work items that appear in status groups (not archived). */
export function activeWorkItems(tasks) {
  return (tasks ?? []).filter((t) => !t.archivedAt);
}

export function archivedWorkItems(tasks) {
  return (tasks ?? []).filter((t) => t.archivedAt);
}

export function groupWorkItems(tasks) {
  const active = activeWorkItems(tasks);
  return {
    in_progress: active.filter((t) => t.status === "in_progress"),
    todo: active.filter((t) => t.status === "todo"),
    blocked: active.filter((t) => t.status === "blocked"),
    done: active.filter((t) => t.status === "done"),
    archived: archivedWorkItems(tasks),
  };
}
