-- Developer tech stack now uses the shared `tags` table via a join table,
-- matching the post_tags / project_tags pattern. The legacy `tech_stack`
-- TEXT column on developers is dropped.

CREATE TABLE developer_tags (
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (developer_id, tag_id)
);

CREATE INDEX idx_developer_tags_developer_id ON developer_tags(developer_id);
CREATE INDEX idx_developer_tags_tag_id ON developer_tags(tag_id);

-- Drop the legacy JSON column. No live data exists in D1 (developer rows
-- are populated by hand), so this is safe.
ALTER TABLE developers DROP COLUMN tech_stack;