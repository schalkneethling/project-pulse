-- Project Pulse - Store review-requested GitHub PR details for project pages

alter table public.github_activity
  add column if not exists review_requested_pr_details jsonb not null default '[]'::jsonb;
