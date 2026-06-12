-- Merge breadcrumbs into tasks, add archive support, retire breadcrumbs table.

-- ─── Extend tasks ───────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS who         text,
  ADD COLUMN IF NOT EXISTS source      text,
  ADD COLUMN IF NOT EXISTS source_url  text,
  ADD COLUMN IF NOT EXISTS due_date    date,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ─── Extend projects ──────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_user_archived
  ON public.projects (user_id, archived_at);

CREATE INDEX IF NOT EXISTS idx_tasks_project_archived
  ON public.tasks (project_id, archived_at);

-- ─── Inbox projects for unlinked breadcrumbs ──────────────────
INSERT INTO public.projects (user_id, name, status, description, next_step)
SELECT DISTINCT b.user_id, 'Inbox', 'active', 'Migrated follow-ups without a project', ''
FROM public.breadcrumbs b
WHERE b.project_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.user_id = b.user_id AND p.name = 'Inbox'
  );

-- ─── Migrate breadcrumbs → tasks ─────────────────────────────
INSERT INTO public.tasks (
  project_id,
  user_id,
  title,
  status,
  who,
  source,
  source_url,
  due_date,
  created_at,
  updated_at,
  archived_at
)
SELECT
  COALESCE(
    b.project_id,
    (SELECT p.id FROM public.projects p WHERE p.user_id = b.user_id AND p.name = 'Inbox' LIMIT 1)
  ),
  b.user_id,
  b.note,
  CASE b.status
    WHEN 'backlog'     THEN 'todo'
    WHEN 'ready'       THEN 'todo'
    WHEN 'open'        THEN 'todo'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'on_hold'     THEN 'blocked'
    WHEN 'waiting'     THEN 'blocked'
    WHEN 'done'        THEN 'done'
    WHEN 'resolved'    THEN 'done'
    ELSE 'todo'
  END,
  b.who,
  b.source,
  b.source_url,
  b.due_date,
  b.created_at,
  COALESCE(b.updated_at, b.created_at),
  CASE
    WHEN b.status IN ('done', 'resolved') THEN COALESCE(b.updated_at, b.created_at)
    ELSE NULL
  END
FROM public.breadcrumbs b;

-- ─── Retire breadcrumbs ───────────────────────────────────────
ALTER TABLE IF EXISTS public.breadcrumbs RENAME TO _breadcrumbs_archive;
