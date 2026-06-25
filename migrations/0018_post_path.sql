-- Add `path` field to posts table for hierarchical folder structure.
-- Examples: '/', '/terraform', '/terraform/', '/ai/platform/something'.
-- Existing rows default to '/' (root).
-- Index for path-prefix queries used by folder navigation.

ALTER TABLE posts ADD COLUMN path TEXT NOT NULL DEFAULT '/';
CREATE INDEX idx_posts_path ON posts(path);