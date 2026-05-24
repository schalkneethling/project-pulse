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

    // We can select created_at / updated_at but NOT the token columns
    // (column-level revoke). If a row exists the user has saved settings.
    const { data, error } = await supabase
      .from("user_settings")
      .select("user_id, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Fetch settings error:", error);
    }

    // If a row exists, tokens *may* have been saved. We can't read them,
    // so we optimistically assume they were set if the row is present.
    // The real check happens server-side in the edge functions.
    dispatch({ type: "HYDRATED", hasNetlify: !!data, hasGithub: !!data });
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
        return;
      }

      const payload = {};
      if (netlifyToken !== undefined) {
        payload.netlify_api_token = netlifyToken;
      }
      if (githubToken !== undefined) {
        payload.github_token = githubToken;
      }

      if (Object.keys(payload).length === 0) {
        return;
      }

      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" });

      if (error) {
        console.error("Save tokens error:", error);
        return;
      }

      dispatch({
        type: "SAVED",
        hasNetlify: netlifyToken !== undefined ? !!netlifyToken : undefined,
        hasGithub: githubToken !== undefined ? !!githubToken : undefined,
      });
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
