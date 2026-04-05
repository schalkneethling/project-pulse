import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./useSettings";

vi.mock("../lib/supabase");

import { supabase } from "../lib/supabase";

// Helper to create a chainable query builder that resolves to `resolveValue`
function mockQuery(resolveValue) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };
  return builder;
}

describe("useSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state", () => {
    supabase.from.mockReturnValue(mockQuery({ data: null, error: null }));
    const { result } = renderHook(() => useSettings("user-1"));

    expect(result.current.loading).toBe(true);
  });

  it("detects existing settings row", async () => {
    supabase.from.mockReturnValue(
      mockQuery({
        data: { user_id: "user-1", updated_at: "2026-01-01" },
        error: null,
      })
    );

    const { result } = renderHook(() => useSettings("user-1"));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNetlifyToken).toBe(true);
    expect(result.current.hasGithubToken).toBe(true);
  });

  it("reports no tokens when no settings row exists", async () => {
    supabase.from.mockReturnValue(
      mockQuery({ data: null, error: null })
    );

    const { result } = renderHook(() => useSettings("user-1"));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNetlifyToken).toBe(false);
    expect(result.current.hasGithubToken).toBe(false);
  });

  it("saveTokens upserts to user_settings", async () => {
    const builder = mockQuery({ data: null, error: null });
    supabase.from.mockReturnValue(builder);

    const { result } = renderHook(() => useSettings("user-1"));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveTokens({ netlifyToken: "nf-token-123" });
    });

    expect(supabase.from).toHaveBeenCalledWith("user_settings");
    expect(builder.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", netlify_api_token: "nf-token-123" },
      { onConflict: "user_id" }
    );
  });

  it("does nothing when no userId", async () => {
    const { result } = renderHook(() => useSettings(null));

    // Should not call supabase at all
    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it("does nothing when saveTokens called with no values", async () => {
    const builder = mockQuery({ data: null, error: null });
    supabase.from.mockReturnValue(builder);

    const { result } = renderHook(() => useSettings("user-1"));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Reset to track only saveTokens calls
    supabase.from.mockClear();

    await act(async () => {
      await result.current.saveTokens({});
    });

    // Should not have called supabase.from for the upsert
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
