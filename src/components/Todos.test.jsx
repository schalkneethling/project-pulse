import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TodoForm,
  TodoCard,
  TodoList,
} from "./Todos";

afterEach(() => {
  vi.useRealTimers();
});

describe("TodoForm", () => {
  it("renders the todo input", () => {
    render(<TodoForm onCreate={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: /todo/i })
    ).toBeInTheDocument();
  });

  it("calls onCreate with note when submitted", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onCreate={onCreate} />);

    await user.type(
      screen.getByRole("textbox", { name: /todo/i }),
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
    render(<TodoForm onCreate={onCreate} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("clears the form after successful submission", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onCreate={onCreate} />);

    const input = screen.getByRole("textbox", { name: /todo/i });
    await user.type(input, "Some note");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(input).toHaveValue("");
  });

  it("reveals detail fields when details/summary is toggled", async () => {
    const user = userEvent.setup();
    const { container } = render(<TodoForm onCreate={vi.fn()} />);

    const details = container.querySelector("details");
    expect(details).not.toHaveAttribute("open");

    await user.click(screen.getByText(/more details/i));

    expect(details).toHaveAttribute("open");
    expect(
      screen.getByRole("textbox", { name: /who is involved/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^source$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it("includes detail fields in submission", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onCreate={onCreate} />);

    await user.type(
      screen.getByRole("textbox", { name: /todo/i }),
      "API design discussion"
    );
    await user.click(screen.getByText(/more details/i));
    await user.type(
      screen.getByRole("textbox", { name: /who is involved/i }),
      "@alice"
    );
    await user.type(screen.getByRole("textbox", { name: /^source$/i }), "#backend");
    await user.type(screen.getByLabelText(/due date/i), "2026-05-04");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        note: "API design discussion",
        who: "@alice",
        source: "#backend",
        dueDate: "2026-05-04",
      })
    );
  });
});

describe("TodoCard", () => {
  const baseTodo = {
    id: "b1",
    note: "Follow up on deploy pipeline",
    who: "@bob",
    source: "#devops",
    sourceUrl: null,
    projectId: null,
    status: "open",
    dueDate: null,
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
  };

  it("renders the note text", () => {
    render(
      <TodoCard
        todo={baseTodo}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/follow up on deploy pipeline/i)).toBeInTheDocument();
  });

  it("renders who and source when present", () => {
    render(
      <TodoCard
        todo={baseTodo}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/@bob/)).toBeInTheDocument();
    expect(screen.getByText(/#devops/)).toBeInTheDocument();
  });

  it("renders URLs in notes as clickable links", () => {
    const todo = {
      ...baseTodo,
      note: "See https://example.com/issue/123 for details",
    };
    render(
      <TodoCard
        todo={todo}
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
      <TodoCard
        todo={baseTodo}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(onUpdate).toHaveBeenCalledWith("b1", { status: "resolved" });
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <TodoCard
        todo={baseTodo}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith("b1");
  });

  it("turns yellow when due today", () => {
    vi.setSystemTime(new Date("2026-04-30T12:00:00"));

    const { container } = render(
      <TodoCard
        todo={{ ...baseTodo, dueDate: "2026-04-30" }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/due apr 30, 2026/i)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("border-yellow-600/70");
  });

  it("turns red when late", () => {
    vi.setSystemTime(new Date("2026-04-30T12:00:00"));

    const { container } = render(
      <TodoCard
        todo={{ ...baseTodo, dueDate: "2026-04-29" }}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(container.firstChild).toHaveClass("border-red-600/70");
  });
});

describe("TodoList", () => {
  const todos = [
    {
      id: "b1",
      note: "Auth discussion",
      who: "@alice",
      source: "#backend",
      sourceUrl: null,
      projectId: null,
      status: "open",
      dueDate: null,
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
      dueDate: null,
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
      dueDate: null,
      createdAt: "2026-04-03T10:00:00Z",
      updatedAt: "2026-04-03T10:00:00Z",
    },
  ];

  it("renders all todos by default", () => {
    render(
      <TodoList
        todos={todos}
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
      <TodoList
        todos={todos}
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
      <TodoList
        todos={todos}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.type(
      screen.getByRole("textbox", { name: /search/i }),
      "deploy"
    );

    expect(screen.getByText(/deploy pipeline review/i)).toBeInTheDocument();
    expect(screen.queryByText(/auth discussion/i)).not.toBeInTheDocument();
  });

  it("shows empty state when no todos match", async () => {
    const user = userEvent.setup();
    render(
      <TodoList
        todos={todos}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.type(
      screen.getByRole("textbox", { name: /search/i }),
      "zzzznonexistent"
    );

    expect(screen.getByText(/no todos/i)).toBeInTheDocument();
  });
});
