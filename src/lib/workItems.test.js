import { describe, it, expect } from "vitest";
import {
  visibleProjects,
  archivedProjects,
  activeWorkItems,
  groupWorkItems,
} from "./workItems";

const projects = [
  { id: "1", archivedAt: null, tasks: [{ id: "t1", status: "todo", archivedAt: null }] },
  { id: "2", archivedAt: "2026-01-01", tasks: [] },
];

describe("workItems", () => {
  it("filters visible and archived projects", () => {
    expect(visibleProjects(projects)).toHaveLength(1);
    expect(archivedProjects(projects)).toHaveLength(1);
  });

  it("groups work items by status", () => {
    const tasks = [
      { id: "a", status: "in_progress", archivedAt: null },
      { id: "b", status: "todo", archivedAt: null },
      { id: "c", status: "done", archivedAt: null },
      { id: "d", status: "todo", archivedAt: "2026-01-01" },
    ];
    const groups = groupWorkItems(tasks);
    expect(groups.in_progress).toHaveLength(1);
    expect(groups.todo).toHaveLength(1);
    expect(groups.done).toHaveLength(1);
    expect(groups.archived).toHaveLength(1);
    expect(activeWorkItems(tasks)).toHaveLength(3);
  });
});
