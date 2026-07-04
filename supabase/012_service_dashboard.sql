-- Project Pulse - Generic services dashboard foundation
--
-- Adds a provider-agnostic model for service connections, tracked
-- resources, normalized snapshots, and derived alerts. Secrets remain
-- unreadable from browser clients; only presence flags are exposed.

-- ─── Service connections ───────────────────────────────────
create table if not exists public.service_connections (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  provider              text not null check (length(provider) > 0),
  display_name          text not null default '',
  auth_type             text not null default 'token'
                          check (auth_type in ('token', 'oauth', 'manual', 'none')),
  enabled               boolean not null default true,
  sync_interval_minutes integer not null default 60
                          check (sync_interval_minutes between 5 and 1440),
  secret_value          text,
  has_secret            boolean not null default false,
  budget_monthly_cents  integer check (budget_monthly_cents is null or budget_monthly_cents >= 0),
  budget_currency       text not null default 'USD'
                          check (budget_currency ~ '^[A-Z]{3}$'),
  metadata              jsonb not null default '{}'::jsonb,
  last_synced_at        timestamptz,
  last_error            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.service_connections enable row level security;

create unique index if not exists idx_service_connections_user_provider_name
  on public.service_connections (user_id, provider, display_name);

create index if not exists idx_service_connections_user_provider
  on public.service_connections (user_id, provider);

create policy "Users can read own service connections"
  on public.service_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own service connections"
  on public.service_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own service connections"
  on public.service_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own service connections"
  on public.service_connections for delete
  using (auth.uid() = user_id);

revoke select (secret_value) on public.service_connections from authenticated;

create or replace function public.service_connections_sync_secret_flag()
returns trigger
language plpgsql
as $$
begin
  new.has_secret := new.secret_value is not null and length(new.secret_value) > 0;
  return new;
end;
$$;

drop trigger if exists service_connections_sync_secret_flag on public.service_connections;
create trigger service_connections_sync_secret_flag
  before insert or update on public.service_connections
  for each row execute function public.service_connections_sync_secret_flag();

drop trigger if exists set_service_connections_updated_at on public.service_connections;
create trigger set_service_connections_updated_at
  before update on public.service_connections
  for each row execute function public.handle_updated_at();

-- ─── Service resources ─────────────────────────────────────
create table if not exists public.service_resources (
  id                   uuid primary key default gen_random_uuid(),
  connection_id        uuid not null references public.service_connections(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  project_id           uuid references public.projects(id) on delete set null,
  resource_type        text not null default 'account' check (length(resource_type) > 0),
  provider_resource_id text not null default '',
  display_name         text not null default '',
  resource_url         text,
  enabled              boolean not null default true,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.service_resources enable row level security;

create index if not exists idx_service_resources_connection
  on public.service_resources (connection_id);

create index if not exists idx_service_resources_user_project
  on public.service_resources (user_id, project_id);

create unique index if not exists idx_service_resources_provider_resource
  on public.service_resources (connection_id, resource_type, provider_resource_id)
  where provider_resource_id <> '';

create policy "Users can read own service resources"
  on public.service_resources for select
  using (auth.uid() = user_id);

create policy "Users can insert own service resources"
  on public.service_resources for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.service_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
  );

create policy "Users can update own service resources"
  on public.service_resources for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.service_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = auth.uid()
      )
    )
  );

create policy "Users can delete own service resources"
  on public.service_resources for delete
  using (auth.uid() = user_id);

drop trigger if exists set_service_resources_updated_at on public.service_resources;
create trigger set_service_resources_updated_at
  before update on public.service_resources
  for each row execute function public.handle_updated_at();

-- ─── Service snapshots ─────────────────────────────────────
create table if not exists public.service_snapshots (
  id                uuid primary key default gen_random_uuid(),
  connection_id     uuid not null references public.service_connections(id) on delete cascade,
  resource_id       uuid references public.service_resources(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  resource_key      text not null default '__connection__' check (length(resource_key) > 0),
  snapshot_key      text not null default 'current' check (length(snapshot_key) > 0),
  period_start      timestamptz not null default '1970-01-01 00:00:00+00'::timestamptz,
  period_end        timestamptz,
  provider_status   text not null default 'unknown'
                       check (provider_status in ('ok', 'warning', 'error', 'unknown', 'unavailable')),
  summary           jsonb not null default '{}'::jsonb,
  metrics           jsonb not null default '{}'::jsonb,
  cost_cents        integer check (cost_cents is null or cost_cents >= 0),
  currency          text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  rate_limit        jsonb not null default '{}'::jsonb,
  raw_payload       jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  synced_at         timestamptz not null default now(),
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.service_snapshots enable row level security;

create unique index if not exists idx_service_snapshots_current
  on public.service_snapshots (connection_id, resource_key, snapshot_key, period_start);

create index if not exists idx_service_snapshots_user_synced
  on public.service_snapshots (user_id, synced_at desc);

create index if not exists idx_service_snapshots_resource
  on public.service_snapshots (resource_id);

create policy "Users can read own service snapshots"
  on public.service_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert own service snapshots"
  on public.service_snapshots for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.service_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
    and (
      resource_id is null
      or exists (
        select 1 from public.service_resources r
        where r.id = resource_id and r.user_id = auth.uid()
      )
    )
  );

create policy "Users can update own service snapshots"
  on public.service_snapshots for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.service_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
    and (
      resource_id is null
      or exists (
        select 1 from public.service_resources r
        where r.id = resource_id and r.user_id = auth.uid()
      )
    )
  );

create policy "Users can delete own service snapshots"
  on public.service_snapshots for delete
  using (auth.uid() = user_id);

-- ─── Service alerts ────────────────────────────────────────
create table if not exists public.service_alerts (
  id            uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.service_connections(id) on delete cascade,
  resource_id   uuid references public.service_resources(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_key  text not null default '__connection__' check (length(resource_key) > 0),
  alert_key     text not null check (length(alert_key) > 0),
  severity      text not null default 'warning'
                  check (severity in ('info', 'warning', 'critical')),
  status        text not null default 'active'
                  check (status in ('active', 'resolved')),
  title         text not null,
  description   text,
  action_url    text,
  metadata      jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.service_alerts enable row level security;

create unique index if not exists idx_service_alerts_connection_key
  on public.service_alerts (connection_id, resource_key, alert_key);

create index if not exists idx_service_alerts_user_status
  on public.service_alerts (user_id, status, severity);

create index if not exists idx_service_alerts_resource
  on public.service_alerts (resource_id);

create policy "Users can read own service alerts"
  on public.service_alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own service alerts"
  on public.service_alerts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.service_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
    and (
      resource_id is null
      or exists (
        select 1 from public.service_resources r
        where r.id = resource_id and r.user_id = auth.uid()
      )
    )
  );

create policy "Users can update own service alerts"
  on public.service_alerts for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.service_connections c
      where c.id = connection_id and c.user_id = auth.uid()
    )
    and (
      resource_id is null
      or exists (
        select 1 from public.service_resources r
        where r.id = resource_id and r.user_id = auth.uid()
      )
    )
  );

create policy "Users can delete own service alerts"
  on public.service_alerts for delete
  using (auth.uid() = user_id);

-- ─── Realtime publication ──────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.service_snapshots;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.service_alerts;
exception when duplicate_object then null;
end $$;
