DROP INDEX IF EXISTS idx_posts_hidden;
DROP INDEX IF EXISTS idx_projects_hidden;

ALTER TABLE posts DROP COLUMN hidden;
ALTER TABLE projects DROP COLUMN hidden;

CREATE TABLE IF NOT EXISTS translation_jobs (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL CHECK(content_type IN ('post', 'project', 'developer')),
  content_id TEXT NOT NULL,
  source_locale TEXT NOT NULL,
  target_locale TEXT NOT NULL,
  author_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0 NOT NULL,
  max_attempts INTEGER DEFAULT 3 NOT NULL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_content ON translation_jobs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_running ON translation_jobs(content_type, content_id, target_locale);
