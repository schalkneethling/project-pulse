import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Manages user settings — API tokens for Netlify and GitHub.
 *
 * Tokens are write-only from the frontend (column-level RLS prevents reading
 * them back). The hook tracks whether each token has been saved by checking
 * if the user_settings row exists and relying on a boolean flag returned
 * alongside the (redacted) row.
 */
export function useSettings(userId) {
  const [hasNetlifyToken, setHasNetlifyToken] = useState(false);
  const [hasGithubToken, setHasGithubToken] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;

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
    if (data) {
      setHasNetlifyToken(true);
      setHasGithubToken(true);
    }

    setLoading(false);
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
      if (!userId) return;

      const payload = {};
      if (netlifyToken !== undefined) payload.netlify_api_token = netlifyToken;
      if (githubToken !== undefined) payload.github_token = githubToken;

      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" });

      if (error) {
        console.error("Save tokens error:", error);
        return;
      }

      if (netlifyToken !== undefined) setHasNetlifyToken(!!netlifyToken);
      if (githubToken !== undefined) setHasGithubToken(!!githubToken);
    },
    [userId],
  );

  return { hasNetlifyToken, hasGithubToken, loading, saveTokens };
}
