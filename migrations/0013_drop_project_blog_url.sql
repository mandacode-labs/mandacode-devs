-- Drop the legacy blog_url column from projects. The id-based
-- blog_post_id (FK to posts.id) is the only way to link a project to
-- a blog post going forward — see PR #71. The renderer in
-- ProjectActions.astro now derives the href as /{lang}/blog/{blog_post_id}
-- from blog_post_id alone, so a free-text URL is no longer needed.
--
-- SQLite supports ALTER TABLE ... DROP COLUMN natively (3.35+),
-- which Cloudflare D1 implements, so this is a single statement.

ALTER TABLE projects DROP COLUMN blog_url;
