import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Subscribes to row-level changes on netlify_deploys and github_activity
 * for the current user, invoking `onChange` whenever a relevant event
 * arrives. The frontend uses this to surface a toast inviting the user
 * to refresh their data.
 */
export function useRealtimeSync(userId, onChange) {
  useEffect(() => {
    let channel = null;

    if (userId) {
      channel = supabase
        .channel(`pulse-activity-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "netlify_deploys",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => onChange?.({ source: "netlify", payload }),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "github_activity",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => onChange?.({ source: "github", payload }),
        );
      channel.subscribe();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [userId, onChange]);
}
