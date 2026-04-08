import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useBreadcrumbs(userId) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBreadcrumbs = useCallback(async () => {
    if (!userId) return;

    const { data, error: fetchError } = await supabase
      .from("breadcrumbs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error("Fetch breadcrumbs error:", fetchError);
    } else {
      setBreadcrumbs((data || []).map(normalize));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBreadcrumbs();
  }, [fetchBreadcrumbs]);

  const createBreadcrumb = useCallback(
    async ({ note, who, source, sourceUrl, projectId }) => {
      const { data, error } = await supabase
        .from("breadcrumbs")
        .insert({
          user_id: userId,
          note,
          who: who || null,
          source: source || null,
          source_url: sourceUrl || null,
          project_id: projectId || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Create breadcrumb error:", error);
        return null;
      }

      const created = normalize(data);
      setBreadcrumbs((prev) => [created, ...prev]);
      return created;
    },
    [userId]
  );

  const updateBreadcrumb = useCallback(async (id, updates) => {
    const payload = {};
    if ("note" in updates) payload.note = updates.note;
    if ("who" in updates) payload.who = updates.who;
    if ("source" in updates) payload.source = updates.source;
    if ("sourceUrl" in updates) payload.source_url = updates.sourceUrl;
    if ("projectId" in updates) payload.project_id = updates.projectId;
    if ("status" in updates) payload.status = updates.status;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("breadcrumbs")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Update breadcrumb error:", error);
      return;
    }

    setBreadcrumbs((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, ...updates, updatedAt: payload.updated_at }
          : b
      )
    );
  }, []);

  const deleteBreadcrumb = useCallback(async (id) => {
    const { error } = await supabase
      .from("breadcrumbs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete breadcrumb error:", error);
      return;
    }

    setBreadcrumbs((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    breadcrumbs,
    loading,
    error,
    createBreadcrumb,
    updateBreadcrumb,
    deleteBreadcrumb,
    refetch: fetchBreadcrumbs,
  };
}

function normalize(row) {
  return {
    id: row.id,
    note: row.note,
    who: row.who,
    source: row.source,
    sourceUrl: row.source_url,
    projectId: row.project_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
