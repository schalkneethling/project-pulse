import { createClient } from "@supabase/supabase-js";

const GITHUB_API = "https://api.github.com";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!token) return json({ error: "Missing authorization token" }, 401);
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  if (!body?.projectId) return json({ error: "projectId is required" }, 400);

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Invalid or expired token" }, 401);

  const { data: repo, error: repoError } = await supabase
    .from("github_repos")
    .select("id, project_id, owner, repo")
    .eq("project_id", body.projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (repoError) return json({ error: repoError.message }, 500);
  if (!repo) return json({ error: "Linked GitHub repository not found" }, 404);

  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("github_token")
    .eq("user_id", user.id)
    .maybeSingle();
  if (settingsError) return json({ error: settingsError.message }, 500);
  if (!settings?.github_token) return json({ error: "No GitHub token configured" }, 400);

  const headers = {
    Authorization: `Bearer ${settings.github_token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const issues = [];
  const base = `${GITHUB_API}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues`;

  for (let page = 1; ; page += 1) {
    let response;
    try {
      response = await fetch(`${base}?state=open&per_page=100&page=${page}`, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      return json({ error: error?.name === "TimeoutError" ? "GitHub request timed out" : error.message }, 502);
    }
    if (!response.ok) return json({ error: `GitHub issue sync failed (${response.status})` }, 502);
    const pageItems = await response.json();
    if (!Array.isArray(pageItems)) return json({ error: "GitHub returned an invalid issue list" }, 502);
    issues.push(...pageItems.filter((issue) => !issue.pull_request));
    if (pageItems.length < 100) break;
  }

  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("id, title, description, source_url, status, github_issue_id, github_issue_open, github_completed_by_sync")
    .eq("github_repo_id", repo.id)
    .eq("user_id", user.id);
  if (existingError) return json({ error: existingError.message }, 500);

  const byIssueId = new Map((existing || []).map((task) => [String(task.github_issue_id), task]));
  const openIds = new Set(issues.map((issue) => String(issue.id)));
  const counts = { created: 0, updated: 0, completed: 0, reopened: 0, unchanged: 0 };

  for (const issue of issues) {
    const current = byIssueId.get(String(issue.id));
    const common = {
      title: issue.title || "Untitled GitHub issue",
      description: issue.body || "",
      source: `GitHub issue #${issue.number}`,
      source_url: issue.html_url,
      github_issue_number: issue.number,
      github_issue_open: true,
      updated_at: new Date().toISOString(),
    };

    if (!current) {
      const { error } = await supabase.from("tasks").insert({
        ...common,
        project_id: repo.project_id,
        user_id: user.id,
        status: "todo",
        github_repo_id: repo.id,
        github_issue_id: issue.id,
        github_completed_by_sync: false,
      });
      if (error?.code === "23505") {
        const { error: retryError } = await supabase
          .from("tasks")
          .update(common)
          .eq("github_repo_id", repo.id)
          .eq("github_issue_id", issue.id)
          .eq("user_id", user.id);
        if (retryError) return json({ error: retryError.message }, 500);
        counts.updated += 1;
      } else if (error) {
        return json({ error: error.message }, 500);
      } else {
        counts.created += 1;
      }
      continue;
    }

    const reopened = current.github_issue_open === false && current.github_completed_by_sync;
    const updates = reopened
      ? { ...common, status: "todo", github_completed_by_sync: false }
      : common;
    const changed =
      reopened ||
      current.title !== common.title ||
      (current.description || "") !== common.description ||
      current.source_url !== common.source_url ||
      current.github_issue_open !== true;
    if (!changed) {
      counts.unchanged += 1;
      continue;
    }
    const { error } = await supabase.from("tasks").update(updates).eq("id", current.id).eq("user_id", user.id);
    if (error) return json({ error: error.message }, 500);
    counts[reopened ? "reopened" : "updated"] += 1;
  }

  for (const task of existing || []) {
    if (openIds.has(String(task.github_issue_id)) || task.github_issue_open === false) continue;
    const { error } = await supabase
      .from("tasks")
      .update({
        status: "done",
        github_issue_open: false,
        github_completed_by_sync: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("user_id", user.id);
    if (error) return json({ error: error.message }, 500);
    counts.completed += 1;
  }

  return json(counts);
};

export const config = { path: "/.netlify/functions/sync-github-issues" };
