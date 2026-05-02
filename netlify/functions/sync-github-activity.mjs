import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Function: sync-github-activity
 *
 * Fetches open PRs, review-requested PRs, assigned issues, and latest
 * commit for each linked GitHub repo. Upserts results into github_activity.
 *
 * Environment variables (set in Netlify UI):
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key
 */
export default async (request) => {
  // ── Auth ──────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // ── Read GitHub token ─────────────────────────────────────
  const { data: settings } = await supabase
    .from("user_settings")
    .select("github_token")
    .eq("user_id", userId)
    .maybeSingle();

  const githubToken = settings?.github_token;

  if (!githubToken) {
    return new Response(
      JSON.stringify({ error: "No GitHub token configured. Add one in Settings." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Fetch all linked repos for this user ──────────────────
  const { data: repos, error: reposError } = await supabase
    .from("github_repos")
    .select("id, owner, repo, project_id")
    .eq("user_id", userId);

  if (reposError) {
    return new Response(JSON.stringify({ error: reposError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!repos || repos.length === 0) {
    return new Response(JSON.stringify({ synced: 0, results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ghHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // ── Helper to fetch JSON from the GitHub API ──────────────
  async function ghFetch(url) {
    const res = await fetch(url, { headers: ghHeaders });
    if (!res.ok) return null;
    return res.json();
  }

  function mapGitHubItemDetails(items) {
    return items.map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      openedAt: item.created_at,
      url: item.html_url,
    }));
  }

  // ── Get the authenticated GitHub username for filtering ───
  const ghUser = await ghFetch("https://api.github.com/user");
  const ghUsername = ghUser?.login || "";

  // ── For each repo, gather activity data ───────────────────
  const results = [];

  for (const r of repos) {
    const base = `https://api.github.com/repos/${r.owner}/${r.repo}`;

    try {
      // Fetch in parallel: open PRs, assigned issues, latest commit, repo metadata
      const [prs, issues, commits, repoMeta] = await Promise.all([
        ghFetch(`${base}/pulls?state=open&per_page=100`),
        ghFetch(`${base}/issues?assignee=${ghUsername}&state=open&per_page=100`),
        ghFetch(`${base}/commits?per_page=1`),
        ghFetch(base), // GET /repos/{owner}/{repo} → open_issues_count
      ]);

      const openPrs = Array.isArray(prs) ? prs.length : 0;
      const reviewRequested = Array.isArray(prs)
        ? prs.filter((pr) =>
            pr.requested_reviewers?.some((rev) => rev.login === ghUsername)
          ).length
        : 0;
      const reviewRequestedPrDetails = Array.isArray(prs)
        ? mapGitHubItemDetails(
            prs.filter((pr) =>
              pr.requested_reviewers?.some((rev) => rev.login === ghUsername)
            )
          )
        : [];
      const assignedIssueDetails = Array.isArray(issues)
        ? mapGitHubItemDetails(issues.filter((issue) => !issue.pull_request))
        : [];
      const assignedIssues = assignedIssueDetails.length;
      // GitHub's open_issues_count includes PRs, so subtract to get issues-only.
      // Use != null so a legitimate 0 isn't treated as missing.
      const totalIssues = repoMeta?.open_issues_count != null
        ? Math.max(0, repoMeta.open_issues_count - openPrs)
        : 0;
      const latestCommit = Array.isArray(commits) && commits[0]
        ? {
            at: commits[0].commit?.committer?.date || null,
            message: commits[0].commit?.message || null,
          }
        : { at: null, message: null };

      // Delete old activity for this repo, then insert fresh snapshot
      await supabase
        .from("github_activity")
        .delete()
        .eq("github_repo_id", r.id);

      const { error: insertError } = await supabase
        .from("github_activity")
        .insert({
          github_repo_id: r.id,
          user_id: userId,
          open_prs: openPrs,
          review_requested_prs: reviewRequested,
          review_requested_pr_details: reviewRequestedPrDetails,
          assigned_issues: assignedIssues,
          assigned_issue_details: assignedIssueDetails,
          total_issues: totalIssues,
          latest_commit_at: latestCommit.at,
          latest_commit_message: latestCommit.message,
          synced_at: new Date().toISOString(),
        });

      if (insertError) {
        results.push({ repoId: r.id, error: insertError.message });
      } else {
        results.push({
          repoId: r.id,
          owner: r.owner,
          repo: r.repo,
          openPrs,
          reviewRequested,
          assignedIssues,
          totalIssues,
        });
      }
    } catch (err) {
      results.push({ repoId: r.id, error: err.message });
    }
  }

  return new Response(
    JSON.stringify({ synced: results.filter((r) => !r.error).length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const config = {
  path: "/.netlify/functions/sync-github-activity",
};
