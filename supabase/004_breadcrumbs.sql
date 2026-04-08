-- Breadcrumbs: quick-capture trail for scattered conversations
CREATE TABLE breadcrumbs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  note       TEXT NOT NULL,
  who        TEXT,          -- person(s) involved, e.g. "@alice, @bob"
  source     TEXT,          -- where it happened, e.g. "mattermost #backend"
  source_url TEXT,          -- optional direct link
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status     TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_breadcrumbs_user_status ON breadcrumbs (user_id, status);
CREATE INDEX idx_breadcrumbs_project ON breadcrumbs (project_id) WHERE project_id IS NOT NULL;

ALTER TABLE breadcrumbs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own breadcrumbs"
  ON breadcrumbs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
