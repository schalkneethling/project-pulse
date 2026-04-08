import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBreadcrumbs } from "./useBreadcrumbs";
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
    single: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve) => resolve(resolvedValue),
  };
  return chain;
}

describe("useBreadcrumbs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches breadcrumbs on mount", async () => {
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
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z",
      },
    ];

    supabase.from.mockReturnValue(mockChain({ data: rows, error: null }));

    const { result } = renderHook(() => useBreadcrumbs(USER_ID));

    // Wait for useEffect to resolve
    await act(() => Promise.resolve());

    expect(supabase.from).toHaveBeenCalledWith("breadcrumbs");
    expect(result.current.breadcrumbs).toHaveLength(1);
    expect(result.current.breadcrumbs[0]).toEqual({
      id: "b1",
      note: "Check auth approach with Alice",
      who: "@alice",
      source: "#backend",
      sourceUrl: null,
      projectId: null,
      status: "open",
      createdAt: "2026-04-01T10:00:00Z",
      updatedAt: "2026-04-01T10:00:00Z",
    });
    expect(result.current.loading).toBe(false);
  });

  it("returns empty array when userId is not provided", async () => {
    const { result } = renderHook(() => useBreadcrumbs(null));

    await act(() => Promise.resolve());

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.breadcrumbs).toEqual([]);
  });

  it("creates a breadcrumb and updates state optimistically", async () => {
    const newRow = {
      id: "b2",
      user_id: USER_ID,
      note: "Discuss deploy pipeline",
      who: null,
      source: null,
      source_url: null,
      project_id: null,
      status: "open",
      created_at: "2026-04-08T12:00:00Z",
      updated_at: "2026-04-08T12:00:00Z",
    };

    // First call: fetch (empty), second call: insert
    supabase.from
      .mockReturnValueOnce(mockChain({ data: [], error: null }))
      .mockReturnValueOnce(
        mockChain({ data: newRow, error: null })
      );

    const { result } = renderHook(() => useBreadcrumbs(USER_ID));
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.createBreadcrumb({
        note: "Discuss deploy pipeline",
      });
    });

    expect(result.current.breadcrumbs).toHaveLength(1);
    expect(result.current.breadcrumbs[0].note).toBe(
      "Discuss deploy pipeline"
    );
  });

  it("updates a breadcrumb status", async () => {
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
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z",
      },
    ];

    supabase.from
      .mockReturnValueOnce(mockChain({ data: rows, error: null }))
      .mockReturnValueOnce(mockChain({ data: null, error: null }));

    const { result } = renderHook(() => useBreadcrumbs(USER_ID));
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.updateBreadcrumb("b1", { status: "resolved" });
    });

    expect(result.current.breadcrumbs[0].status).toBe("resolved");
  });

  it("deletes a breadcrumb", async () => {
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
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z",
      },
    ];

    supabase.from
      .mockReturnValueOnce(mockChain({ data: rows, error: null }))
      .mockReturnValueOnce(mockChain({ data: null, error: null }));

    const { result } = renderHook(() => useBreadcrumbs(USER_ID));
    await act(() => Promise.resolve());

    await act(async () => {
      await result.current.deleteBreadcrumb("b1");
    });

    expect(result.current.breadcrumbs).toHaveLength(0);
  });

  it("sets error when fetch fails", async () => {
    supabase.from.mockReturnValue(
      mockChain({ data: null, error: { message: "Network error" } })
    );

    const { result } = renderHook(() => useBreadcrumbs(USER_ID));
    await act(() => Promise.resolve());

    expect(result.current.error).toBe("Network error");
    expect(result.current.breadcrumbs).toEqual([]);
  });
});
