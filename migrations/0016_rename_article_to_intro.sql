-- Rename `article` column back to `intro`. The previous rename (0015)
-- used "article" but the Korean label preferred is 서론/본론, which
-- pairs naturally with "intro" / "body" in code.

ALTER TABLE post_translations      RENAME COLUMN article TO intro;
ALTER TABLE project_translations   RENAME COLUMN article TO intro;
ALTER TABLE developer_translations RENAME COLUMN article TO intro;
