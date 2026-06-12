import { useState, useEffect, useCallback } from "react";
import { WORK_ITEM_STATUSES } from "../lib/constants";
import { safeHttpUrl } from "../lib/linkify";
import { supabase } from "../lib/supabase";

function normalizeWorkStatus(status) {
  return WORK_ITEM_STATUSES.has(status) ? status : "todo";
}

function failTaskMutation(error, label) {
  console.error(label, error);
  throw error;
}

function toDbSourceUrl(value) {
  if (value == null || value === "") return null;
  const normalized = safeHttpUrl(value);
  if (!normalized) {
    throw new Error("Source link must be a valid http or https URL.");
  }
  return normalized;
}

/**
 * Fetches all projects for the current user, including their tasks
 * and linked Netlify site/deploy data.
 */
export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(
    async (signal) => {
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
        const normalized = (data || []).map(normalizeProject);
        setProjects(normalized);
      }

      setLoading(false);
    },
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchProjects(controller.signal);
    return () => controller.abort();
  }, [fetchProjects]);

  const touchProject = useCallback(async (projectId) => {
    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }, []);

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

  const updateProject = useCallback(async (id, updates) => {
    const { tasks: _tasks, netlify: _netlify, github: _github, ...dbFields } = updates;
    const payload = {};
    if ("name" in dbFields) payload.name = dbFields.name;
    if ("description" in dbFields) payload.description = dbFields.description;
    if ("status" in dbFields) payload.status = dbFields.status;
    if ("nextStep" in dbFields) payload.next_step = dbFields.nextStep;
    if ("next_step" in dbFields) payload.next_step = dbFields.next_step;
    if ("sortOrder" in dbFields) payload.sort_order = dbFields.sortOrder;
    if ("archivedAt" in dbFields) payload.archived_at = dbFields.archivedAt;

    if (Object.keys(payload).length === 0) return;

    const now = new Date().toISOString();
    payload.updated_at = now;

    const { error } = await supabase.from("projects").update(payload).eq("id", id);

    if (error) {
      console.error("Update project error:", error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...dbFields, updatedAt: now } : p)),
    );
  }, []);

  const deleteProject = useCallback(async (id) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      console.error("Delete project error:", error);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const archiveProject = useCallback(
    async (id) => {
      const now = new Date().toISOString();
      await updateProject(id, { archivedAt: now });
    },
    [updateProject],
  );

  const unarchiveProject = useCallback(
    async (id) => {
      await updateProject(id, { archivedAt: null });
    },
    [updateProject],
  );

  const addTask = useCallback(
    async (projectId, fields) => {
      const title = typeof fields === "string" ? fields : fields.title;
      const payload = {
        project_id: projectId,
        user_id: userId,
        title: title.trim(),
      };

      if (typeof fields === "object" && fields !== null) {
        if (fields.who) payload.who = fields.who;
        if (fields.source) payload.source = fields.source;
        if ("sourceUrl" in fields) payload.source_url = toDbSourceUrl(fields.sourceUrl);
        if (fields.dueDate) payload.due_date = fields.dueDate;
        if (fields.status) payload.status = normalizeWorkStatus(fields.status);
      }

      const { data, error } = await supabase.from("tasks").insert(payload).select().single();

      if (error) failTaskMutation(error, "Add task error:");

      const task = normalizeTask(data);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, tasks: [...p.tasks, task], updatedAt: new Date().toISOString() }
            : p,
        ),
      );

      await touchProject(projectId);
      return task;
    },
    [userId, touchProject],
  );

  const updateTask = useCallback(
    async (projectId, taskId, updates) => {
      const payload = taskUpdatesToDb(updates);
      if (Object.keys(payload).length > 0) {
        payload.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", taskId)
        .select()
        .single();

      if (error) failTaskMutation(error, "Update task error:");

      const task = normalizeTask(data);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? task : t)),
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );

      await touchProject(projectId);
      return task;
    },
    [touchProject],
  );

  const deleteTask = useCallback(
    async (projectId, taskId) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) failTaskMutation(error, "Delete task error:");

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== taskId),
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );

      await touchProject(projectId);
    },
    [touchProject],
  );

  const archiveTask = useCallback(
    async (projectId, taskId) => {
      const now = new Date().toISOString();
      return updateTask(projectId, taskId, { archivedAt: now });
    },
    [updateTask],
  );

  const unarchiveTask = useCallback(
    async (projectId, taskId) => {
      return updateTask(projectId, taskId, { archivedAt: null });
    },
    [updateTask],
  );

  const saveNetlifySite = useCallback(
    async (projectId, netlifyData) => {
      const sitePayload = {
        project_id: projectId,
        user_id: userId,
        netlify_site_id: netlifyData.siteId || "",
        site_name: netlifyData.siteName || "",
        site_url: netlifyData.url || "",
      };

      const { data: existing } = await supabase
        .from("netlify_sites")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      let siteId;

      if (existing) {
        siteId = existing.id;
        await supabase.from("netlify_sites").update(sitePayload).eq("id", siteId);
      } else {
        const { data: created } = await supabase
          .from("netlify_sites")
          .insert(sitePayload)
          .select("id")
          .single();
        siteId = created?.id;
      }

      if (siteId && netlifyData.lastDeploy) {
        const deploy = netlifyData.lastDeploy;

        await supabase.from("netlify_deploys").delete().eq("netlify_site_id", siteId);

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

      await fetchProjects();
    },
    [userId, fetchProjects],
  );

  const removeNetlifySite = useCallback(async (projectId) => {
    await supabase.from("netlify_sites").delete().eq("project_id", projectId);

    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, netlify: null } : p)));
  }, []);

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
        await supabase.from("github_repos").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("github_repos").insert(payload);
      }

      await fetchProjects();
    },
    [userId, fetchProjects],
  );

  const removeGithubRepo = useCallback(async (projectId) => {
    await supabase.from("github_repos").delete().eq("project_id", projectId);

    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, github: null } : p)));
  }, []);

  const syncNetlifyDeploys = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return { error: "Not authenticated" };

    const res = await fetch("/.netlify/functions/sync-netlify-deploys", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const result = await res.json();
    if (res.ok) await fetchProjects();
    return result;
  }, [fetchProjects]);

  const syncGithubActivity = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
    archiveProject,
    unarchiveProject,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    saveNetlifySite,
    removeNetlifySite,
    saveGithubRepo,
    removeGithubRepo,
    syncNetlifyDeploys,
    syncGithubActivity,
    refetch: fetchProjects,
  };
}

function taskUpdatesToDb(updates) {
  const payload = {};
  if ("title" in updates) payload.title = updates.title;
  if ("status" in updates) payload.status = normalizeWorkStatus(updates.status);
  if ("who" in updates) payload.who = updates.who;
  if ("source" in updates) payload.source = updates.source;
  if ("sourceUrl" in updates) payload.source_url = toDbSourceUrl(updates.sourceUrl);
  if ("dueDate" in updates) payload.due_date = updates.dueDate;
  if ("archivedAt" in updates) payload.archived_at = updates.archivedAt;
  return payload;
}

function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    who: t.who ?? null,
    source: t.source ?? null,
    sourceUrl: safeHttpUrl(t.source_url),
    dueDate: t.due_date ?? null,
    archivedAt: t.archived_at ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at ?? t.created_at,
  };
}

function normalizeProject(row) {
  const tasks = (row.tasks || []).map(normalizeTask);

  let netlify = null;
  const site = Array.isArray(row.netlify_sites) ? row.netlify_sites[0] : row.netlify_sites;

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
  const ghRepo = Array.isArray(row.github_repos) ? row.github_repos[0] : row.github_repos;

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
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks,
    netlify,
    github,
  };
}
