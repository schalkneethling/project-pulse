import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTodos } from "./useTodos";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase");

const USER_ID = "user-123";

// Helper to make a chainable mock that resolves to the given value
function mockChain(resolvedValue = { data: [], error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    // eslint-disable-next-line unicorn/no-thenable -- intentional: mock must be awaitable
    then: (resolve) => resolve(resolvedValue),
  };
  return chain;
}

describe("useTodos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches todos on mount", async () => {
    const rows = [
      {
        id: "b1",
        user_id: USER_ID,
        note: "Check auth approach with Alice",
        who: "@alice",
        source: "#backend",
        source_url: null,
        project_id: null,
        status: "open",
        due_date: "2026-04-30",
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z",
      },
    ];

    supabase.from.mockReturnValue(mockChain({ data: rows, error: null }));

    const { result } = renderHook(() => useTodos(USER_ID));

    // Wait for useEffect to resolve
    await act(() => Promise.resolve());

    expect(supabase.from).toHaveBeenCalledWith("breadcrumbs");
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0]).toEqual({
      id: "b1",
      note: "Check auth approach with Alice",
      who: "@alice",
      source: "#backend",
      sourceUrl: null,
      projectId: null,
      status: "open",
      dueDate: "2026-04-30",
      createdAt: "2026-04-01T10:00:00Z",
      updatedAt: "2026-04-01T10:00:00Z",
    });
    expect(result.current.loading).toBe(false);
  });

  it("returns empty array when userId is not provided", async () => {
    const { result } = renderHook(() => useTodos(null));

    await act(() => Promise.resolve());

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.todos).toEqual([]);
  });

  it("creates a todo and updates state optimistically", async () => {
    const newRow = {
      id: "b2",
      user_id: USER_ID,
      note: "Discuss deploy pipeline",
      who: null,
      source: null,
      source_url: null,
      project_id: null,
      status: "open",
      due_date: "2026-05-04",
      created_at: "2026-04-08T12:00:00Z",
      updated_at: "2026-04-08T12:00:00Z",
    };

    // First call: fetch (empty), second call: insert
    supabase.from
      .mockReturnValueOnce(mockChain({ data: [], error: null }))
      .mockReturnValueOnce(mockChain({ data: newRow, error: null }));

    const { result } = renderHook(() => useTodos(USER_ID));
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.createTodo({
        note: "Discuss deploy pipeline",
        dueDate: "2026-05-04",
      });
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].note).toBe("Discuss deploy pipeline");
    expect(result.current.todos[0].dueDate).toBe("2026-05-04");
  });

  it("updates a todo status and due date", async () => {
    const rows = [
      {
        id: "b1",
        user_id: USER_ID,
        note: "Follow up on API design",
        who: "@bob",
        source: "DM",
        source_url: null,
        project_id: null,
        status: "open",
        due_date: null,
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z",
      },
    ];

    supabase.from
      .mockReturnValueOnce(mockChain({ data: rows, error: null }))
      .mockReturnValueOnce(mockChain({ data: null, error: null }));

    const { result } = renderHook(() => useTodos(USER_ID));
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.updateTodo("b1", { status: "resolved", dueDate: "2026-05-01" });
    });

    expect(result.current.todos[0].status).toBe("resolved");
    expect(result.current.todos[0].dueDate).toBe("2026-05-01");
  });

  it("deletes a todo", async () => {
    const rows = [
      {
        id: "b1",
        user_id: USER_ID,
        note: "Old note",
        who: null,
        source: null,
        source_url: null,
        project_id: null,
        status: "open",
        due_date: null,
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z",
      },
    ];

    supabase.from
      .mockReturnValueOnce(mockChain({ data: rows, error: null }))
      .mockReturnValueOnce(mockChain({ data: null, error: null }));

    const { result } = renderHook(() => useTodos(USER_ID));
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.deleteTodo("b1");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("sets error when fetch fails", async () => {
    supabase.from.mockReturnValue(mockChain({ data: null, error: { message: "Network error" } }));

    const { result } = renderHook(() => useTodos(USER_ID));
    await act(() => Promise.resolve());

    expect(result.current.error).toBe("Network error");
    expect(result.current.todos).toEqual([]);
  });
});
