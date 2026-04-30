import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useTodos(userId) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(async (signal) => {
    if (!userId) return;

    const { data, error: fetchError } = await supabase
      .from("breadcrumbs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .abortSignal(signal);

    if (signal?.aborted) return;

    if (fetchError) {
      setError(fetchError.message);
      console.error("Fetch todos error:", fetchError);
    } else {
      setTodos((data || []).map(normalize));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTodos(controller.signal);
    return () => controller.abort();
  }, [fetchTodos]);

  const createTodo = useCallback(
    async ({ note, who, source, sourceUrl, projectId, dueDate }) => {
      const { data, error } = await supabase
        .from("breadcrumbs")
        .insert({
          user_id: userId,
          note,
          who: who || null,
          source: source || null,
          source_url: sourceUrl || null,
          project_id: projectId || null,
          due_date: dueDate || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Create todo error:", error);
        return null;
      }

      const created = normalize(data);
      setTodos((prev) => [created, ...prev]);
      return created;
    },
    [userId]
  );

  const updateTodo = useCallback(async (id, updates) => {
    const FIELD_MAP = {
      note: "note",
      who: "who",
      source: "source",
      sourceUrl: "source_url",
      projectId: "project_id",
      status: "status",
      dueDate: "due_date",
    };

    const payload = { updated_at: new Date().toISOString() };
    for (const [key, column] of Object.entries(FIELD_MAP)) {
      if (key in updates) {
        payload[column] = updates[key];
      }
    }

    const { error } = await supabase
      .from("breadcrumbs")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Update todo error:", error);
      return;
    }

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, ...updates, updatedAt: payload.updated_at }
          : todo
      )
    );
  }, []);

  const deleteTodo = useCallback(async (id) => {
    const { error } = await supabase
      .from("breadcrumbs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete todo error:", error);
      return;
    }

    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    refetch: fetchTodos,
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
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
