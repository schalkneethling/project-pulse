import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BreadcrumbForm,
  BreadcrumbCard,
  BreadcrumbList,
} from "./Breadcrumbs";

describe("BreadcrumbForm", () => {
  it("renders the note input", () => {
    render(<BreadcrumbForm onCreate={vi.fn()} />);

    expect(
      screen.getByPlaceholderText(/what did you hear/i)
    ).toBeInTheDocument();
  });

  it("calls onCreate with note when submitted", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<BreadcrumbForm onCreate={onCreate} />);

    await user.type(
      screen.getByPlaceholderText(/what did you hear/i),
      "Check auth with Alice"
    );
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ note: "Check auth with Alice" })
    );
  });

  it("does not submit when note is empty", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<BreadcrumbForm onCreate={onCreate} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("clears the form after successful submission", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<BreadcrumbForm onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/what did you hear/i);
    await user.type(input, "Some note");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(input).toHaveValue("");
  });

  it("reveals detail fields when 'More details' is toggled", async () => {
    const user = userEvent.setup();
    render(<BreadcrumbForm onCreate={vi.fn()} />);

    expect(
      screen.queryByPlaceholderText(/who was involved/i)
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /more details/i })
    );

    expect(
      screen.getByPlaceholderText(/who was involved/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/where/i)).toBeInTheDocument();
  });

  it("includes detail fields in submission", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<BreadcrumbForm onCreate={onCreate} />);

    await user.type(
      screen.getByPlaceholderText(/what did you hear/i),
      "API design discussion"
    );
    await user.click(
      screen.getByRole("button", { name: /more details/i })
    );
    await user.type(
      screen.getByPlaceholderText(/who was involved/i),
      "@alice"
    );
    await user.type(screen.getByPlaceholderText(/where/i), "#backend");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        note: "API design discussion",
        who: "@alice",
        source: "#backend",
      })
    );
  });
});

describe("BreadcrumbCard", () => {
  const baseCrumb = {
    id: "b1",
    note: "Follow up on deploy pipeline",
    who: "@bob",
    source: "#devops",
    sourceUrl: null,
    projectId: null,
    status: "open",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
  };

  it("renders the note text", () => {
    render(
      <BreadcrumbCard
        breadcrumb={baseCrumb}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/follow up on deploy pipeline/i)).toBeInTheDocument();
  });

  it("renders who and source when present", () => {
    render(
      <BreadcrumbCard
        breadcrumb={baseCrumb}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/@bob/)).toBeInTheDocument();
    expect(screen.getByText(/#devops/)).toBeInTheDocument();
  });

  it("renders URLs in notes as clickable links", () => {
    const crumb = {
      ...baseCrumb,
      note: "See https://example.com/issue/123 for details",
    };
    render(
      <BreadcrumbCard
        breadcrumb={crumb}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const link = screen.getByRole("link", {
      name: "https://example.com/issue/123",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://example.com/issue/123"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("calls onUpdate with new status when status is changed", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(
      <BreadcrumbCard
        breadcrumb={baseCrumb}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /resolved/i }));

    expect(onUpdate).toHaveBeenCalledWith("b1", { status: "resolved" });
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <BreadcrumbCard
        breadcrumb={baseCrumb}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith("b1");
  });
});

describe("BreadcrumbList", () => {
  const crumbs = [
    {
      id: "b1",
      note: "Auth discussion",
      who: "@alice",
      source: "#backend",
      sourceUrl: null,
      projectId: null,
      status: "open",
      createdAt: "2026-04-01T10:00:00Z",
      updatedAt: "2026-04-01T10:00:00Z",
    },
    {
      id: "b2",
      note: "Deploy pipeline review",
      who: "@bob",
      source: "DM",
      sourceUrl: null,
      projectId: null,
      status: "resolved",
      createdAt: "2026-04-02T10:00:00Z",
      updatedAt: "2026-04-02T10:00:00Z",
    },
    {
      id: "b3",
      note: "Waiting on API feedback",
      who: null,
      source: null,
      sourceUrl: null,
      projectId: null,
      status: "waiting",
      createdAt: "2026-04-03T10:00:00Z",
      updatedAt: "2026-04-03T10:00:00Z",
    },
  ];

  it("renders all breadcrumbs by default", () => {
    render(
      <BreadcrumbList
        breadcrumbs={crumbs}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/auth discussion/i)).toBeInTheDocument();
    expect(screen.getByText(/deploy pipeline review/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting on api feedback/i)).toBeInTheDocument();
  });

  it("filters by status when a tab is selected", async () => {
    const user = userEvent.setup();
    render(
      <BreadcrumbList
        breadcrumbs={crumbs}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Click the "open" filter tab (first one in the tab bar)
    const tabs = screen.getAllByRole("button", { name: /^open$/i });
    await user.click(tabs[0]);

    expect(screen.getByText(/auth discussion/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/deploy pipeline review/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/waiting on api feedback/i)
    ).not.toBeInTheDocument();
  });

  it("filters by search text", async () => {
    const user = userEvent.setup();
    render(
      <BreadcrumbList
        breadcrumbs={crumbs}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/search/i),
      "deploy"
    );

    expect(screen.getByText(/deploy pipeline review/i)).toBeInTheDocument();
    expect(screen.queryByText(/auth discussion/i)).not.toBeInTheDocument();
  });

  it("shows empty state when no breadcrumbs match", async () => {
    const user = userEvent.setup();
    render(
      <BreadcrumbList
        breadcrumbs={crumbs}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/search/i),
      "zzzznonexistent"
    );

    expect(screen.getByText(/no breadcrumbs/i)).toBeInTheDocument();
  });
});
