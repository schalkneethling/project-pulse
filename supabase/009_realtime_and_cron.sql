-- Project Pulse - Realtime + scheduled background sync
--
-- Four parts:
--   1. Enable Supabase Realtime on the activity tables so the frontend
--      gets pushed updates whenever a row is inserted/updated/deleted.
--   2. Add uniqueness on netlify_deploys.netlify_site_id and
--      github_activity.github_repo_id so the sync functions can use an
--      atomic upsert instead of a non-transactional delete-then-insert.
--   3. Expose readable per-token presence booleans on user_settings, so
--      the frontend can distinguish "Netlify saved" from "GitHub saved"
--      without ever reading the (RLS-protected) token values.
--   4. Schedule a pg_cron job that calls the `sync-all` Netlify Function
--      every 30 minutes via pg_net, pre-warming data before the user opens
--      the dashboard. The on-demand refresh buttons still hit the per-user
--      sync endpoints for finer-grained updates.

-- ─── 1. Realtime publication ─────────────────────────────────────────
-- Safe to re-run: the DO block swallows the "already in publication" error.
do $$
begin
  alter publication supabase_realtime add table public.netlify_deploys;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.github_activity;
exception when duplicate_object then null;
end $$;

-- ─── 2. Uniqueness for atomic upserts ────────────────────────────────
-- Each linked site/repo has at most one current activity snapshot — the
-- sync function replaces it on every run. A unique constraint lets us
-- use `.upsert({ … }, { onConflict: 'netlify_site_id' })` instead of a
-- delete-then-insert race.
alter table public.netlify_deploys
  add constraint netlify_deploys_site_id_key unique (netlify_site_id);

alter table public.github_activity
  add constraint github_activity_repo_id_key unique (github_repo_id);

-- ─── 3. Per-token presence flags on user_settings ────────────────────
-- The token columns themselves are RLS-locked (column-level revoke), so
-- the frontend can't see whether each one is set. These boolean shadows
-- expose only the "is it present?" bit and are kept in sync by a trigger
-- so they cannot drift from the actual token values.
alter table public.user_settings
  add column if not exists has_netlify_token boolean not null default false,
  add column if not exists has_github_token  boolean not null default false;

create or replace function public.user_settings_sync_token_flags()
returns trigger
language plpgsql
as $$
begin
  new.has_netlify_token := new.netlify_api_token is not null and length(new.netlify_api_token) > 0;
  new.has_github_token  := new.github_token       is not null and length(new.github_token)       > 0;
  return new;
end;
$$;

drop trigger if exists user_settings_sync_token_flags on public.user_settings;
create trigger user_settings_sync_token_flags
  before insert or update on public.user_settings
  for each row execute function public.user_settings_sync_token_flags();

-- Backfill existing rows so the flags reflect current token state.
update public.user_settings
  set netlify_api_token = netlify_api_token,
      github_token      = github_token;

-- The flag columns are safe to read; tokens themselves stay locked.
grant select (has_netlify_token, has_github_token)
  on public.user_settings
  to authenticated;

-- ─── 4. Scheduled sync via pg_cron + pg_net ──────────────────────────
-- HOW TO ENABLE (run these manually after replacing the placeholders):
--
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   -- Store the shared secret used to authenticate the cron → function call.
--   -- The same value must be set as SYNC_ALL_SECRET in the Netlify Function env.
--   alter database postgres set "app.sync_all_secret" = 'replace-with-long-random-secret';
--
--   select cron.schedule(
--     'sync-all-activity',
--     '*/30 * * * *',
--     $$
--       select net.http_post(
--         url := 'https://YOUR-SITE.netlify.app/.netlify/functions/sync-all',
--         headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', 'Bearer ' || current_setting('app.sync_all_secret')
--         ),
--         body := '{}'::jsonb,
--         timeout_milliseconds := 60000
--       );
--     $$
--   );
--
-- To unschedule:
--   select cron.unschedule('sync-all-activity');
