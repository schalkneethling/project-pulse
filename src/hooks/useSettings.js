import { useReducer, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Manages user settings — API tokens for Netlify and GitHub.
 *
 * Tokens are write-only from the frontend (column-level RLS prevents reading
 * them back). We track whether each token has been saved in a single reducer-
 * managed slot and derive the per-provider booleans during render.
 *
 * Using `useReducer` (rather than `useState` mirrored from a `useEffect`)
 * makes it explicit that the store is updated by named actions, not
 * mirrored from props or other state.
 */

const initialState = { loaded: false, hasNetlify: false, hasGithub: false };

function settingsReducer(state, action) {
  switch (action.type) {
    case "HYDRATED":
      return { loaded: true, hasNetlify: action.hasNetlify, hasGithub: action.hasGithub };
    case "SAVED":
      return {
        loaded: true,
        hasNetlify: action.hasNetlify ?? state.hasNetlify,
        hasGithub: action.hasGithub ?? state.hasGithub,
      };
    default:
      return state;
  }
}

export function useSettings(userId) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      return;
    }

    // Tokens themselves are RLS-locked; the boolean shadow columns added
    // in migration 009 expose only whether each provider has a saved
    // token, kept in sync by a database trigger.
    const { data, error } = await supabase
      .from("user_settings")
      .select("has_netlify_token, has_github_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Fetch settings error:", error);
    }

    dispatch({
      type: "HYDRATED",
      hasNetlify: !!data?.has_netlify_token,
      hasGithub: !!data?.has_github_token,
    });
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Save one or both API tokens. Pass `{ netlifyToken, githubToken }`.
   * Only non-undefined values are written.
   */
  const saveTokens = useCallback(
    async ({ netlifyToken, githubToken } = {}) => {
      if (!userId) {
        return { success: false, error: new Error("Not signed in") };
      }

      const payload = {};
      if (netlifyToken !== undefined) {
        payload.netlify_api_token = netlifyToken;
      }
      if (githubToken !== undefined) {
        payload.github_token = githubToken;
      }

      if (Object.keys(payload).length === 0) {
        return { success: false, error: new Error("No tokens to save") };
      }

      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" });

      if (error) {
        console.error("Save tokens error:", error);
        return { success: false, error };
      }

      dispatch({
        type: "SAVED",
        hasNetlify: netlifyToken !== undefined ? !!netlifyToken : undefined,
        hasGithub: githubToken !== undefined ? !!githubToken : undefined,
      });
      return { success: true };
    },
    [userId],
  );

  return {
    hasNetlifyToken: state.hasNetlify,
    hasGithubToken: state.hasGithub,
    loading: !state.loaded,
    saveTokens,
  };
}
