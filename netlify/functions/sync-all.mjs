// Entry point: Netlify discovers this file by filesystem convention
// (see `functions = "netlify/functions"` in netlify.toml) and routes
// requests to /.netlify/functions/sync-all here. It is invoked by a
// Supabase pg_cron job via pg_net.http_post (see the commented schedule
// block in supabase/009_realtime_and_cron.sql) — not imported from any
// JS module.

import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Function: sync-all
 *
 * Service-role background sync. Designed to be called by Supabase pg_cron
 * via pg_net on a schedule (every 5 minutes). Iterates over every user
 * with configured API tokens and refreshes Netlify deploys + GitHub
 * activity for their linked sites/repos.
 *
 * Authentication: a shared secret passed in the Authorization header.
 * The secret is stored both in Postgres (`app.sync_all_secret`) and in
 * this function's environment as `SYNC_ALL_SECRET`.
 *
 * Environment variables:
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key
 *   SYNC_ALL_SECRET       — shared secret matching pg_cron's bearer token
 */
export default async (request) => {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const expectedSecret = process.env.SYNC_ALL_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!expectedSecret || !supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration error" }, 500);
  }

  if (!token || token !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // ── Fetch every user that has at least one configured token ──────
  const { data: users, error: usersError } = await supabase
    .from("user_settings")
    .select("user_id, netlify_api_token, github_token");

  if (usersError) {
    return json({ error: usersError.message }, 500);
  }

  const summary = { users: 0, netlifySites: 0, githubRepos: 0, errors: [] };

  for (const user of users || []) {
    summary.users += 1;

    if (user.netlify_api_token) {
      const result = await syncNetlifyForUser(supabase, user.user_id, user.netlify_api_token);
      summary.netlifySites += result.synced;
      if (result.errors.length) {
        summary.errors.push(...result.errors);
      }
    }

    if (user.github_token) {
      const result = await syncGithubForUser(supabase, user.user_id, user.github_token);
      summary.githubRepos += result.synced;
      if (result.errors.length) {
        summary.errors.push(...result.errors);
      }
    }
  }

  return json(summary, 200);
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Netlify sync (per user) ────────────────────────────────────────
async function syncNetlifyForUser(supabase, userId, netlifyToken) {
  const errors = [];
  let synced = 0;

  const { data: sites, error } = await supabase
    .from("netlify_sites")
    .select("id, netlify_site_id")
    .eq("user_id", userId);

  if (error) {
    return { synced, errors: [`netlify_sites(${userId}): ${error.message}`] };
  }

  for (const site of sites || []) {
    if (!site.netlify_site_id) {
      continue;
    }

    try {
      const res = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.netlify_site_id}/deploys?per_page=1`,
        { headers: { Authorization: `Bearer ${netlifyToken}` } },
      );

      if (!res.ok) {
        errors.push(`netlify ${site.id}: API ${res.status}`);
        continue;
      }

      const deploys = await res.json();
      const d = deploys[0];
      if (!d) {
        continue;
      }

      let state = "ready";
      if (d.state === "error" || d.state === "build_error") {
        state = "error";
      } else if (["building", "uploading", "processing"].includes(d.state)) {
        state = "building";
      } else if (["enqueued", "new"].includes(d.state)) {
        state = "enqueued";
      }

      await supabase.from("netlify_deploys").delete().eq("netlify_site_id", site.id);
      const { error: insertError } = await supabase.from("netlify_deploys").insert({
        netlify_site_id: site.id,
        user_id: userId,
        state,
        branch: d.branch || "main",
        commit_message: d.title || d.commit_message || null,
        deploy_time: d.deploy_time || null,
        error_message: d.error_message || null,
        published_at: d.published_at || null,
      });

      if (insertError) {
        errors.push(`netlify ${site.id}: ${insertError.message}`);
      } else {
        synced += 1;
      }
    } catch (err) {
      errors.push(`netlify ${site.id}: ${err.message}`);
    }
  }

  return { synced, errors };
}

// ─── GitHub sync (per user) ─────────────────────────────────────────
async function syncGithubForUser(supabase, userId, githubToken) {
  const errors = [];
  let synced = 0;

  const { data: repos, error } = await supabase
    .from("github_repos")
    .select("id, owner, repo")
    .eq("user_id", userId);

  if (error) {
    return { synced, errors: [`github_repos(${userId}): ${error.message}`] };
  }
  if (!repos || repos.length === 0) {
    return { synced, errors };
  }

  const ghHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  async function ghFetch(url) {
    const res = await fetch(url, { headers: ghHeaders });
    if (!res.ok) {
      return null;
    }
    return res.json();
  }

  async function ghFetchAllPages(rawUrl) {
    const url = new URL(rawUrl);
    const out = [];
    let page = 1;

    while (true) {
      url.searchParams.set("page", String(page));
      const pageData = await ghFetch(url.toString());

      if (!Array.isArray(pageData) || pageData.length === 0) {
        break;
      }
      out.push(...pageData);
      if (pageData.length < 100) {
        break;
      }
      page += 1;
    }
    return out;
  }

  const ghUser = await ghFetch("https://api.github.com/user");
  const ghUsername = ghUser?.login || "";

  for (const repo of repos) {
    const base = `https://api.github.com/repos/${repo.owner}/${repo.repo}`;
    try {
      const [prs, issues, commits, repoMeta] = await Promise.all([
        ghFetchAllPages(`${base}/pulls?state=open&per_page=100`),
        ghFetchAllPages(`${base}/issues?assignee=${ghUsername}&state=open&per_page=100`),
        ghFetch(`${base}/commits?per_page=1`),
        ghFetch(base),
      ]);

      const openPrs = Array.isArray(prs) ? prs.length : 0;
      const reviewRequestedPrs = Array.isArray(prs)
        ? prs.filter((pr) => pr.requested_reviewers?.some((rev) => rev.login === ghUsername))
        : [];
      const reviewRequestedPrDetails = reviewRequestedPrs.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        openedAt: pr.created_at,
        url: pr.html_url,
      }));
      const assignedIssueDetails = Array.isArray(issues)
        ? issues
            .filter((issue) => !issue.pull_request)
            .map((issue) => ({
              id: issue.id,
              number: issue.number,
              title: issue.title,
              openedAt: issue.created_at,
              url: issue.html_url,
            }))
        : [];
      const totalIssues =
        repoMeta?.open_issues_count != null ? Math.max(0, repoMeta.open_issues_count - openPrs) : 0;
      const latest =
        Array.isArray(commits) && commits[0]
          ? {
              at: commits[0].commit?.committer?.date || null,
              message: commits[0].commit?.message || null,
            }
          : { at: null, message: null };

      await supabase.from("github_activity").delete().eq("github_repo_id", repo.id);
      const { error: insertError } = await supabase.from("github_activity").insert({
        github_repo_id: repo.id,
        user_id: userId,
        open_prs: openPrs,
        review_requested_prs: reviewRequestedPrs.length,
        review_requested_pr_details: reviewRequestedPrDetails,
        assigned_issues: assignedIssueDetails.length,
        assigned_issue_details: assignedIssueDetails,
        total_issues: totalIssues,
        latest_commit_at: latest.at,
        latest_commit_message: latest.message,
        synced_at: new Date().toISOString(),
      });

      if (insertError) {
        errors.push(`github ${repo.id}: ${insertError.message}`);
      } else {
        synced += 1;
      }
    } catch (err) {
      errors.push(`github ${repo.id}: ${err.message}`);
    }
  }

  return { synced, errors };
}

export const config = {
  path: "/.netlify/functions/sync-all",
};
