-- Project Pulse - Store assigned GitHub issue details for project pages

alter table public.github_activity
  add column if not exists assigned_issue_details jsonb not null default '[]'::jsonb;
