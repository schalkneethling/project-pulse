-- Add due dates to existing TODO records stored in the breadcrumbs table.
ALTER TABLE breadcrumbs
  ADD COLUMN IF NOT EXISTS due_date DATE;

CREATE INDEX IF NOT EXISTS idx_breadcrumbs_user_due_date
  ON breadcrumbs (user_id, due_date)
  WHERE due_date IS NOT NULL;
