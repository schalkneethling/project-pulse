-- Project Pulse - Skip unchanged Netlify/GitHub sync writes
--
-- These RPC helpers keep scheduled and manual syncs from updating rows
-- when the upstream snapshot is identical. Because unchanged conflicts do
-- not run UPDATE, Supabase Realtime also has no change event to broadcast.

create or replace function public.upsert_netlify_deploy_if_changed(
  p_netlify_site_id uuid,
  p_user_id uuid,
  p_state text,
  p_branch text,
  p_commit_message text default null,
  p_deploy_time integer default null,
  p_error_message text default null,
  p_published_at timestamptz default null
)
returns boolean
language sql
as $$
  with upserted as (
    insert into public.netlify_deploys (
      netlify_site_id,
      user_id,
      state,
      branch,
      commit_message,
      deploy_time,
      error_message,
      published_at
    )
    values (
      p_netlify_site_id,
      p_user_id,
      p_state,
      p_branch,
      p_commit_message,
      p_deploy_time,
      p_error_message,
      p_published_at
    )
    on conflict (netlify_site_id) do update
      set user_id = excluded.user_id,
          state = excluded.state,
          branch = excluded.branch,
          commit_message = excluded.commit_message,
          deploy_time = excluded.deploy_time,
          error_message = excluded.error_message,
          published_at = excluded.published_at
      where (
        netlify_deploys.user_id,
        netlify_deploys.state,
        netlify_deploys.branch,
        netlify_deploys.commit_message,
        netlify_deploys.deploy_time,
        netlify_deploys.error_message,
        netlify_deploys.published_at
      ) is distinct from (
        excluded.user_id,
        excluded.state,
        excluded.branch,
        excluded.commit_message,
        excluded.deploy_time,
        excluded.error_message,
        excluded.published_at
      )
    returning 1
  )
  select exists(select 1 from upserted);
$$;

create or replace function public.upsert_github_activity_if_changed(
  p_github_repo_id uuid,
  p_user_id uuid,
  p_open_prs integer,
  p_review_requested_prs integer,
  p_review_requested_pr_details jsonb default '[]'::jsonb,
  p_assigned_issues integer default 0,
  p_assigned_issue_details jsonb default '[]'::jsonb,
  p_total_issues integer default 0,
  p_latest_commit_at timestamptz default null,
  p_latest_commit_message text default null,
  p_synced_at timestamptz default now()
)
returns boolean
language sql
as $$
  with upserted as (
    insert into public.github_activity (
      github_repo_id,
      user_id,
      open_prs,
      review_requested_prs,
      review_requested_pr_details,
      assigned_issues,
      assigned_issue_details,
      total_issues,
      latest_commit_at,
      latest_commit_message,
      synced_at
    )
    values (
      p_github_repo_id,
      p_user_id,
      p_open_prs,
      p_review_requested_prs,
      coalesce(p_review_requested_pr_details, '[]'::jsonb),
      p_assigned_issues,
      coalesce(p_assigned_issue_details, '[]'::jsonb),
      p_total_issues,
      p_latest_commit_at,
      p_latest_commit_message,
      p_synced_at
    )
    on conflict (github_repo_id) do update
      set user_id = excluded.user_id,
          open_prs = excluded.open_prs,
          review_requested_prs = excluded.review_requested_prs,
          review_requested_pr_details = excluded.review_requested_pr_details,
          assigned_issues = excluded.assigned_issues,
          assigned_issue_details = excluded.assigned_issue_details,
          total_issues = excluded.total_issues,
          latest_commit_at = excluded.latest_commit_at,
          latest_commit_message = excluded.latest_commit_message,
          synced_at = excluded.synced_at
      where (
        github_activity.user_id,
        github_activity.open_prs,
        github_activity.review_requested_prs,
        github_activity.review_requested_pr_details,
        github_activity.assigned_issues,
        github_activity.assigned_issue_details,
        github_activity.total_issues,
        github_activity.latest_commit_at,
        github_activity.latest_commit_message
      ) is distinct from (
        excluded.user_id,
        excluded.open_prs,
        excluded.review_requested_prs,
        excluded.review_requested_pr_details,
        excluded.assigned_issues,
        excluded.assigned_issue_details,
        excluded.total_issues,
        excluded.latest_commit_at,
        excluded.latest_commit_message
      )
    returning 1
  )
  select exists(select 1 from upserted);
$$;

revoke execute on function public.upsert_netlify_deploy_if_changed(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  text,
  timestamptz
) from public, anon, authenticated;

revoke execute on function public.upsert_github_activity_if_changed(
  uuid,
  uuid,
  integer,
  integer,
  jsonb,
  integer,
  jsonb,
  integer,
  timestamptz,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.upsert_netlify_deploy_if_changed(
  uuid,
  uuid,
  text,
  text,
  text,
  integer,
  text,
  timestamptz
) to service_role;

grant execute on function public.upsert_github_activity_if_changed(
  uuid,
  uuid,
  integer,
  integer,
  jsonb,
  integer,
  jsonb,
  integer,
  timestamptz,
  text,
  timestamptz
) to service_role;
