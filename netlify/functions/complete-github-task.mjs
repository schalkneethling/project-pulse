import { createClient } from "@supabase/supabase-js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization token" }, 401);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return json({ error: "Server configuration error" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  if (!body?.taskId) return json({ error: "taskId is required" }, 400);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Invalid or expired token" }, 401);

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, project_id, github_repo_id, github_issue_number")
    .eq("id", body.taskId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (taskError) return json({ error: taskError.message }, 500);
  if (!task?.github_repo_id || !task.github_issue_number) {
    return json({ error: "GitHub-backed task not found" }, 404);
  }

  const [{ data: repo, error: repoError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase
      .from("github_repos")
      .select("id, owner, repo")
      .eq("id", task.github_repo_id)
      .eq("project_id", task.project_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_settings").select("github_token").eq("user_id", user.id).maybeSingle(),
  ]);
  if (repoError || settingsError) return json({ error: (repoError || settingsError).message }, 500);
  if (!repo) return json({ error: "Linked GitHub repository not found" }, 404);
  if (!settings?.github_token) return json({ error: "No GitHub token configured" }, 400);

  let githubResponse;
  try {
    githubResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/issues/${task.github_issue_number}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${settings.github_token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ state: "closed" }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch (error) {
    return json({ error: error?.name === "TimeoutError" ? "GitHub request timed out" : error.message }, 502);
  }
  if (!githubResponse.ok) {
    return json({ error: `GitHub could not close the issue (${githubResponse.status})` }, 502);
  }

  const { data: updated, error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "done",
      github_issue_open: false,
      github_completed_by_sync: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", task.id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (updateError) {
    return json({ error: "GitHub issue closed, but Pulse could not update the task. Sync issues to reconcile it." }, 500);
  }
  return json({ task: updated });
};

export const config = { path: "/.netlify/functions/complete-github-task" };
