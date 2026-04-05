-- ============================================================
-- Project Pulse — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable RLS on all tables
-- We'll add policies after creating them

-- ─── Projects ───────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default '',
  description text not null default '',
  status      text not null default 'active'
                check (status in ('active', 'paused', 'blocked', 'done')),
  next_step   text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_status on public.projects(user_id, status);

-- ─── Tasks ──────────────────────────────────────────────────
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  status      text not null default 'todo'
                check (status in ('todo', 'in_progress', 'done', 'blocked')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "Users can update own tasks"
  on public.tasks for update
  using (
    auth.uid() = user_id AND
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_user_status on public.tasks(user_id, status);

-- ─── Netlify Sites (linked to projects) ─────────────────────
create table public.netlify_sites (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null unique references public.projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  netlify_site_id text not null default '',     -- Netlify's UUID, for future API sync
  site_name       text not null default '',
  site_url        text not null default '',
  created_at      timestamptz not null default now()
);

alter table public.netlify_sites enable row level security;

create policy "Users can read own netlify sites"
  on public.netlify_sites for select
  using (auth.uid() = user_id);

create policy "Users can insert own netlify sites"
  on public.netlify_sites for insert
  with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "Users can update own netlify sites"
  on public.netlify_sites for update
  using (
    auth.uid() = user_id AND
    exists (
      select 1 from public.projects
      where id = project_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own netlify sites"
  on public.netlify_sites for delete
  using (auth.uid() = user_id);

-- ─── Netlify Deploys (latest deploy per site) ───────────────
create table public.netlify_deploys (
  id              uuid primary key default gen_random_uuid(),
  netlify_site_id uuid not null references public.netlify_sites(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  state           text not null default 'ready'
                    check (state in ('ready', 'building', 'enqueued', 'error')),
  branch          text not null default 'main',
  commit_message  text,
  deploy_time     integer,                      -- seconds
  error_message   text,
  published_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.netlify_deploys enable row level security;

create policy "Users can read own deploys"
  on public.netlify_deploys for select
  using (auth.uid() = user_id);

create policy "Users can insert own deploys"
  on public.netlify_deploys for insert
  with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.netlify_sites
      where id = netlify_site_id and user_id = auth.uid()
    )
  );

create policy "Users can update own deploys"
  on public.netlify_deploys for update
  using (
    auth.uid() = user_id AND
    exists (
      select 1 from public.netlify_sites
      where id = netlify_site_id and user_id = auth.uid()
    )
  );

create policy "Users can delete own deploys"
  on public.netlify_deploys for delete
  using (auth.uid() = user_id);

create index idx_deploys_site_id on public.netlify_deploys(netlify_site_id);

-- ─── Auto-update updated_at on projects ─────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

-- ─── User settings (Netlify API token, etc.) ────────────────
create table public.user_settings (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  netlify_api_token   text,                     -- encrypted at rest by Supabase
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Prevent the frontend client from reading the API token back after it is saved.
-- The authenticated role can write the token but not select it; server-side
-- edge functions that run under the service_role key are not subject to this
-- column-level restriction and can still read the token for API calls.
revoke select (netlify_api_token) on public.user_settings from authenticated;

create trigger set_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.handle_updated_at();
