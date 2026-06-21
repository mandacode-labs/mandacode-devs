-- Split posts/projects/developers into main tables and translation tables.
-- Original content rows (origin IS NULL) become the main row plus an original-locale translation row.
-- Translated content rows (origin IS NOT NULL) become translation rows only.
-- Tags are detached from locale and reference the main content id.

-- Posts ------------------------------------------------------------------

CREATE TABLE posts_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  original_locale TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE post_translations (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts_new(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tiptap_json TEXT NOT NULL,
  cover_image_url TEXT,
  publish_status TEXT DEFAULT 'draft' NOT NULL,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(post_id, locale)
);

CREATE INDEX idx_post_translations_post_id ON post_translations(post_id);
CREATE INDEX idx_post_translations_locale ON post_translations(locale);
CREATE INDEX idx_post_translations_status ON post_translations(publish_status);

INSERT INTO posts_new (id, author_id, original_locale, created_at, updated_at)
SELECT id, author_id, locale, created_at, updated_at
FROM posts
WHERE origin IS NULL;

INSERT INTO post_translations (
  id, post_id, locale, title, description, tiptap_json,
  cover_image_url, publish_status, published_at, created_at, updated_at
)
SELECT
  id || '_' || locale AS id,
  id AS post_id,
  locale,
  title,
  description,
  tiptap_json,
  cover_image_url,
  publish_status,
  published_at,
  created_at,
  updated_at
FROM posts
WHERE origin IS NULL;

INSERT INTO post_translations (
  id, post_id, locale, title, description, tiptap_json,
  cover_image_url, publish_status, published_at, created_at, updated_at
)
SELECT
  id || '_' || locale AS id,
  id AS post_id,
  locale,
  title,
  description,
  tiptap_json,
  cover_image_url,
  publish_status,
  published_at,
  created_at,
  updated_at
FROM posts
WHERE origin IS NOT NULL;

-- Projects ---------------------------------------------------------------

CREATE TABLE projects_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  project_status TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  team_size INTEGER NOT NULL,
  project_order INTEGER NOT NULL,
  url TEXT,
  source_url TEXT,
  blog_url TEXT,
  original_locale TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE project_translations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects_new(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tiptap_json TEXT NOT NULL,
  role TEXT NOT NULL,
  cover_image_url TEXT,
  publish_status TEXT DEFAULT 'draft' NOT NULL,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(project_id, locale)
);

CREATE INDEX idx_project_translations_project_id ON project_translations(project_id);
CREATE INDEX idx_project_translations_locale ON project_translations(locale);
CREATE INDEX idx_project_translations_status ON project_translations(publish_status);

INSERT INTO projects_new (
  id, author_id, project_status, start_date, end_date, team_size,
  project_order, url, source_url, blog_url, original_locale, created_at, updated_at
)
SELECT
  id, author_id, project_status, start_date, end_date, team_size,
  project_order, url, source_url, blog_url, locale, created_at, updated_at
FROM projects
WHERE origin IS NULL;

INSERT INTO project_translations (
  id, project_id, locale, title, description, tiptap_json,
  role, cover_image_url, publish_status, published_at, created_at, updated_at
)
SELECT
  id || '_' || locale AS id,
  id AS project_id,
  locale,
  title,
  description,
  tiptap_json,
  role,
  cover_image_url,
  publish_status,
  published_at,
  created_at,
  updated_at
FROM projects
WHERE origin IS NULL;

INSERT INTO project_translations (
  id, project_id, locale, title, description, tiptap_json,
  role, cover_image_url, publish_status, published_at, created_at, updated_at
)
SELECT
  id || '_' || locale AS id,
  id AS project_id,
  locale,
  title,
  description,
  tiptap_json,
  role,
  cover_image_url,
  publish_status,
  published_at,
  created_at,
  updated_at
FROM projects
WHERE origin IS NOT NULL;

-- Developers -------------------------------------------------------------

CREATE TABLE developers_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  github_url TEXT,
  email TEXT,
  website_url TEXT,
  tech_stack TEXT,
  certifications TEXT,
  education TEXT,
  original_locale TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE developer_translations (
  id TEXT PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developers_new(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  tiptap_json TEXT NOT NULL,
  avatar_url TEXT,
  publish_status TEXT DEFAULT 'draft' NOT NULL,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(developer_id, locale)
);

CREATE INDEX idx_developer_translations_developer_id ON developer_translations(developer_id);
CREATE INDEX idx_developer_translations_locale ON developer_translations(locale);
CREATE INDEX idx_developer_translations_status ON developer_translations(publish_status);

INSERT INTO developers_new (
  id, author_id, github_url, email, website_url, tech_stack,
  certifications, education, original_locale, created_at, updated_at
)
SELECT
  id, author_id, github_url, email, website_url, tech_stack,
  certifications, education, locale, created_at, updated_at
FROM developers
WHERE origin IS NULL;

INSERT INTO developer_translations (
  id, developer_id, locale, name, role, bio, tiptap_json,
  avatar_url, publish_status, published_at, created_at, updated_at
)
SELECT
  id || '_' || locale AS id,
  id AS developer_id,
  locale,
  name,
  role,
  bio,
  tiptap_json,
  avatar_url,
  publish_status,
  published_at,
  created_at,
  updated_at
FROM developers
WHERE origin IS NULL;

INSERT INTO developer_translations (
  id, developer_id, locale, name, role, bio, tiptap_json,
  avatar_url, publish_status, published_at, created_at, updated_at
)
SELECT
  id || '_' || locale AS id,
  id AS developer_id,
  locale,
  name,
  role,
  bio,
  tiptap_json,
  avatar_url,
  publish_status,
  published_at,
  created_at,
  updated_at
FROM developers
WHERE origin IS NOT NULL;

-- Tags -------------------------------------------------------------------

CREATE TABLE post_tags_new (
  post_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts_new(id) ON DELETE CASCADE
);

CREATE TABLE project_tags_new (
  project_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id),
  FOREIGN KEY (project_id) REFERENCES projects_new(id) ON DELETE CASCADE
);

INSERT INTO post_tags_new (post_id, tag_id)
SELECT post_id, tag_id FROM post_tags;

INSERT INTO project_tags_new (project_id, tag_id)
SELECT project_id, tag_id FROM project_tags;

-- Swap tables ------------------------------------------------------------

DROP TABLE post_tags;
DROP TABLE project_tags;
DROP TABLE posts;
DROP TABLE projects;
DROP TABLE developers;

ALTER TABLE posts_new RENAME TO posts;
ALTER TABLE projects_new RENAME TO projects;
ALTER TABLE developers_new RENAME TO developers;
ALTER TABLE post_tags_new RENAME TO post_tags;
ALTER TABLE project_tags_new RENAME TO project_tags;
