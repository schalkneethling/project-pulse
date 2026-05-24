-- Project Pulse - Realtime + scheduled background sync
--
-- Two parts:
--   1. Enable Supabase Realtime on the activity tables so the frontend
--      gets pushed updates whenever a row is inserted/updated/deleted.
--   2. Schedule a pg_cron job that calls the `sync-all` Netlify Function
--      every 5 minutes via pg_net, pre-warming data before the user opens
--      the dashboard.

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

-- ─── 2. Scheduled sync via pg_cron + pg_net ──────────────────────────
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
--     '*/5 * * * *',
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
