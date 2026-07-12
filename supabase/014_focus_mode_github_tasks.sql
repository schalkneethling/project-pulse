-- Focus mode task descriptions and GitHub issue provenance.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS github_repo_id uuid REFERENCES public.github_repos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS github_issue_id bigint,
  ADD COLUMN IF NOT EXISTS github_issue_number integer,
  ADD COLUMN IF NOT EXISTS github_issue_open boolean,
  ADD COLUMN IF NOT EXISTS github_completed_by_sync boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_github_issue
  ON public.tasks (github_repo_id, github_issue_id)
  WHERE github_repo_id IS NOT NULL AND github_issue_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_github_repo
  ON public.tasks (github_repo_id)
  WHERE github_repo_id IS NOT NULL;
