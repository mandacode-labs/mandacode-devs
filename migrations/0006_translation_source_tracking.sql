-- Add source_hash column to track which version of the original content a translation is based on.
-- A translation is "outdated" when its source_hash differs from the current original's hash.
-- Existing rows will have NULL (gradual population on next save).

ALTER TABLE post_translations ADD COLUMN source_hash TEXT;
ALTER TABLE project_translations ADD COLUMN source_hash TEXT;
ALTER TABLE developer_translations ADD COLUMN source_hash TEXT;
