-- Add blog_post_id to projects so a project can reference a blog post by ID
-- rather than a free-text URL. The frontend resolves the ID to
-- /{lang}/blog/{id} at render time, so a single reference works in every
-- language. blog_url is kept for backward compatibility (older projects
-- may still have a manual URL; the renderer prefers blog_post_id when set).

ALTER TABLE projects ADD COLUMN blog_post_id TEXT REFERENCES posts(id);
