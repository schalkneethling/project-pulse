export async function writeNetlifyDeploySnapshot(supabase, deploy) {
  return writeSnapshot(
    supabase.rpc("upsert_netlify_deploy_if_changed", {
      p_netlify_site_id: deploy.netlify_site_id,
      p_user_id: deploy.user_id,
      p_state: deploy.state,
      p_branch: deploy.branch,
      p_commit_message: deploy.commit_message,
      p_deploy_time: deploy.deploy_time,
      p_error_message: deploy.error_message,
      p_published_at: deploy.published_at,
    }),
  );
}

export async function writeGithubActivitySnapshot(supabase, activity) {
  return writeSnapshot(
    supabase.rpc("upsert_github_activity_if_changed", {
      p_github_repo_id: activity.github_repo_id,
      p_user_id: activity.user_id,
      p_open_prs: activity.open_prs,
      p_review_requested_prs: activity.review_requested_prs,
      p_review_requested_pr_details: activity.review_requested_pr_details,
      p_assigned_issues: activity.assigned_issues,
      p_assigned_issue_details: activity.assigned_issue_details,
      p_total_issues: activity.total_issues,
      p_latest_commit_at: activity.latest_commit_at,
      p_latest_commit_message: activity.latest_commit_message,
      p_synced_at: activity.synced_at,
    }),
  );
}

async function writeSnapshot(query) {
  const { data, error } = await query;
  return { changed: data === true, error };
}
