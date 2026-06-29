-- Index on translation_jobs.created_at to support the
-- pruneOldTranslationJobs() retention sweep and any future time-range
-- queries. Safe to run on existing data thanks to IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_translation_jobs_created_at
  ON translation_jobs(created_at);
