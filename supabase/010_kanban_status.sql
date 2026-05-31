-- Expand breadcrumbs (TODOs) into a 5-column Kanban: backlog, ready, in_progress, on_hold, done.
-- Existing statuses map: open -> ready, waiting -> on_hold, resolved -> done.

ALTER TABLE breadcrumbs DROP CONSTRAINT IF EXISTS breadcrumbs_status_check;

UPDATE breadcrumbs SET status = 'ready'    WHERE status = 'open';
UPDATE breadcrumbs SET status = 'on_hold'  WHERE status = 'waiting';
UPDATE breadcrumbs SET status = 'done'     WHERE status = 'resolved';

ALTER TABLE breadcrumbs
  ALTER COLUMN status SET DEFAULT 'backlog',
  ADD CONSTRAINT breadcrumbs_status_check
    CHECK (status IN ('backlog', 'ready', 'in_progress', 'on_hold', 'done'));
