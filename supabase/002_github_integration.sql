-- ============================================================
-- Project Pulse — GitHub Integration Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── Add github_token to user_settings ──────────────────────
alter table public.user_settings
  add column if not exists github_token text;

-- Prevent the frontend client from reading the GitHub token back.
-- Server-side edge functions (service_role) can still read it.
revoke select (github_token) on public.user_settings from authenticated;

-- ─── GitHub Repos (linked to projects) ──────────────────────
create table public.github_repos (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null unique references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  owner       text not null default '',
  repo        text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.github_repos enable row level security;

create policy "Users can read own github repos"
  on public.github_repos for select
  using (auth.uid() = user_id);

create policy "Users can insert own github repos"
  on public.github_repos for insert
  with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "Users can update own github repos"
  on public.github_repos for update
  using (
    auth.uid() = user_id AND
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own github repos"
  on public.github_repos for delete
  using (auth.uid() = user_id);

-- ─── GitHub Activity (latest snapshot per repo) ─────────────
create table public.github_activity (
  id                    uuid primary key default gen_random_uuid(),
  github_repo_id        uuid not null references public.github_repos(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  open_prs              integer not null default 0,
  review_requested_prs  integer not null default 0,
  assigned_issues       integer not null default 0,
  latest_commit_at      timestamptz,
  latest_commit_message text,
  synced_at             timestamptz not null default now()
);

alter table public.github_activity enable row level security;

create policy "Users can read own github activity"
  on public.github_activity for select
  using (auth.uid() = user_id);

create policy "Users can insert own github activity"
  on public.github_activity for insert
  with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.github_repos
      where id = github_repo_id and user_id = auth.uid()
    )
  );

create policy "Users can update own github activity"
  on public.github_activity for update
  using (
    auth.uid() = user_id AND
    exists (
      select 1 from public.github_repos
      where id = github_repo_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own github activity"
  on public.github_activity for delete
  using (auth.uid() = user_id);

create index idx_github_repos_project_id on public.github_repos(project_id);
create index idx_github_activity_repo_id on public.github_activity(github_repo_id);
