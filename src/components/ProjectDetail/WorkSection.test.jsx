import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkSection } from "./WorkSection";

const project = {
  id: "p1",
  tasks: [
    { id: "t1", title: "Ship feature", status: "todo", archivedAt: null },
    { id: "t2", title: "Fix bug", status: "in_progress", archivedAt: null },
  ],
};

describe("WorkSection", () => {
  it("renders status groups and quick add", () => {
    render(
      <WorkSection
        project={project}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Fix bug")).toBeInTheDocument();
    expect(screen.getByText("Ship feature")).toBeInTheDocument();
  });

  it("calls onAdd when form submitted", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <WorkSection
        project={{ ...project, tasks: [] }}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onArchive={vi.fn()}
        onUnarchive={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Work item title"), "New item");
    await user.click(screen.getByLabelText("Add work item"));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "New item" }));
  });
});
