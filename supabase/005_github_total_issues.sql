-- ============================================================
-- Project Pulse — Add total_issues to github_activity
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

alter table public.github_activity
  add column if not exists total_issues integer not null default 0;
