import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches all projects for the current user, including their tasks
 * and linked Netlify site/deploy data.
 */
export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch all projects with relations ───────────────────
  const fetchProjects = useCallback(async (signal) => {
    if (!userId) return;

    const { data, error: fetchError } = await supabase
      .from("projects")
      .select(`
        *,
        tasks (*),
        netlify_sites (
          *,
          netlify_deploys (*)
        ),
        github_repos (
          *,
          github_activity (*)
        )
      `)
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .abortSignal(signal);

    if (signal?.aborted) return;

    if (fetchError) {
      setError(fetchError.message);
      console.error("Fetch projects error:", fetchError);
    } else {
      // Normalize the nested data into a flat-ish structure the UI expects
      const normalized = (data || []).map(normalizeProject);
      setProjects(normalized);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProjects(controller.signal);
    return () => controller.abort();
  }, [fetchProjects]);

  // ─── Create project ──────────────────────────────────────
  const createProject = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Create project error:", error);
      return null;
    }

    const newProject = normalizeProject(data);
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }, [userId]);

  // ─── Update project fields ───────────────────────────────
  const updateProject = useCallback(async (id, updates) => {
    // Only send db-safe columns, strip out UI-only fields
    const { tasks, netlify, ...dbFields } = updates;
    // Convert camelCase to snake_case for the relevant fields
    const payload = {};
    if ("name" in dbFields) payload.name = dbFields.name;
    if ("description" in dbFields) payload.description = dbFields.description;
    if ("status" in dbFields) payload.status = dbFields.status;
    if ("nextStep" in dbFields) payload.next_step = dbFields.nextStep;
    if ("next_step" in dbFields) payload.next_step = dbFields.next_step;
    if ("sortOrder" in dbFields) payload.sort_order = dbFields.sortOrder;

    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Update project error:", error);
      return;
    }

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...dbFields, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // ─── Delete project ──────────────────────────────────────
  const deleteProject = useCallback(async (id) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      console.error("Delete project error:", error);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ─── Add task ────────────────────────────────────────────
  const addTask = useCallback(
    async (projectId, title) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ project_id: projectId, user_id: userId, title })
        .select()
        .single();

      if (error) {
        console.error("Add task error:", error);
        return;
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: [
                  ...p.tasks,
                  {
                    id: data.id,
                    title: data.title,
                    status: data.status,
                    createdAt: data.created_at,
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      // Also touch the project's updated_at
      await supabase
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", projectId);
    },
    [userId]
  );

  // ─── Update task status ──────────────────────────────────
  const updateTask = useCallback(async (projectId, taskId, updates) => {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      console.error("Update task error:", error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }, []);

  // ─── Delete task ─────────────────────────────────────────
  const deleteTask = useCallback(async (projectId, taskId) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      console.error("Delete task error:", error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }, []);

  // ─── Save Netlify site link ──────────────────────────────
  const saveNetlifySite = useCallback(
    async (projectId, netlifyData) => {
      // Upsert the netlify_sites row
      const sitePayload = {
        project_id: projectId,
        user_id: userId,
        netlify_site_id: netlifyData.siteId || "",
        site_name: netlifyData.siteName || "",
        site_url: netlifyData.url || "",
      };

      // Check if one exists already
      const { data: existing } = await supabase
        .from("netlify_sites")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      let siteId;

      if (existing) {
        siteId = existing.id;
        await supabase
          .from("netlify_sites")
          .update(sitePayload)
          .eq("id", siteId);
      } else {
        const { data: created } = await supabase
          .from("netlify_sites")
          .insert(sitePayload)
          .select("id")
          .single();
        siteId = created?.id;
      }

      // Save the deploy snapshot
      if (siteId && netlifyData.lastDeploy) {
        const deploy = netlifyData.lastDeploy;

        // Delete old deploys for this site (we keep latest only for now)
        await supabase
          .from("netlify_deploys")
          .delete()
          .eq("netlify_site_id", siteId);

        await supabase.from("netlify_deploys").insert({
          netlify_site_id: siteId,
          user_id: userId,
          state: deploy.state,
          branch: deploy.branch || "main",
          commit_message: deploy.commitMessage,
          deploy_time: deploy.deployTime,
          error_message: deploy.errorMessage,
          published_at: deploy.publishedAt,
        });
      }

      // Re-fetch to get clean state
      await fetchProjects();
    },
    [userId, fetchProjects]
  );

  // ─── Remove Netlify site link ────────────────────────────
  const removeNetlifySite = useCallback(
    async (projectId) => {
      // Cascade will handle deploys
      await supabase
        .from("netlify_sites")
        .delete()
        .eq("project_id", projectId);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, netlify: null } : p
        )
      );
    },
    []
  );

  // ─── Save GitHub repo link ──────────────────────────────
  const saveGithubRepo = useCallback(
    async (projectId, { owner, repo }) => {
      const payload = {
        project_id: projectId,
        user_id: userId,
        owner: owner || "",
        repo: repo || "",
      };

      const { data: existing } = await supabase
        .from("github_repos")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("github_repos")
          .update(payload)
          .eq("id", existing.id);
      } else {
        await supabase.from("github_repos").insert(payload);
      }

      await fetchProjects();
    },
    [userId, fetchProjects]
  );

  // ─── Remove GitHub repo link ────────────────────────────
  const removeGithubRepo = useCallback(
    async (projectId) => {
      await supabase
        .from("github_repos")
        .delete()
        .eq("project_id", projectId);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, github: null } : p
        )
      );
    },
    []
  );

  // ─── Sync Netlify deploys via serverless function ───────
  const syncNetlifyDeploys = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: "Not authenticated" };

    const res = await fetch("/.netlify/functions/sync-netlify-deploys", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const result = await res.json();
    if (res.ok) await fetchProjects();
    return result;
  }, [fetchProjects]);

  // ─── Sync GitHub activity via serverless function ───────
  const syncGithubActivity = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: "Not authenticated" };

    const res = await fetch("/.netlify/functions/sync-github-activity", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const result = await res.json();
    if (res.ok) await fetchProjects();
    return result;
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    saveNetlifySite,
    removeNetlifySite,
    saveGithubRepo,
    removeGithubRepo,
    syncNetlifyDeploys,
    syncGithubActivity,
    refetch: fetchProjects,
  };
}

// ─── Normalize DB row to UI shape ────────────────────────────
function normalizeProject(row) {
  const tasks = (row.tasks || []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    createdAt: t.created_at,
  }));

  let netlify = null;
  const site = Array.isArray(row.netlify_sites)
    ? row.netlify_sites[0]
    : row.netlify_sites;

  if (site) {
    const deploy = Array.isArray(site.netlify_deploys)
      ? site.netlify_deploys[0]
      : site.netlify_deploys;

    netlify = {
      siteId: site.netlify_site_id,
      siteName: site.site_name,
      url: site.site_url,
      lastDeploy: deploy
        ? {
            state: deploy.state,
            branch: deploy.branch,
            commitMessage: deploy.commit_message,
            deployTime: deploy.deploy_time,
            errorMessage: deploy.error_message,
            publishedAt: deploy.published_at,
            createdAt: deploy.created_at,
          }
        : null,
    };
  }

  let github = null;
  const ghRepo = Array.isArray(row.github_repos)
    ? row.github_repos[0]
    : row.github_repos;

  if (ghRepo) {
    const activity = Array.isArray(ghRepo.github_activity)
      ? ghRepo.github_activity[0]
      : ghRepo.github_activity;

    github = {
      owner: ghRepo.owner,
      repo: ghRepo.repo,
      activity: activity
        ? {
            openPrs: activity.open_prs,
            reviewRequestedPrs: activity.review_requested_prs,
            reviewRequestedPrDetails: Array.isArray(activity.review_requested_pr_details)
              ? activity.review_requested_pr_details
              : [],
            assignedIssues: activity.assigned_issues,
            assignedIssueDetails: Array.isArray(activity.assigned_issue_details)
              ? activity.assigned_issue_details
              : [],
            totalIssues: activity.total_issues ?? 0,
            latestCommitAt: activity.latest_commit_at,
            latestCommitMessage: activity.latest_commit_message,
            syncedAt: activity.synced_at,
          }
        : null,
    };
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    nextStep: row.next_step,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks,
    netlify,
    github,
  };
}
