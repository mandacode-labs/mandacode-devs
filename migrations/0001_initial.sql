CREATE TABLE IF NOT EXISTS posts (
  id TEXT NOT NULL,
  locale TEXT NOT NULL,
  origin TEXT,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tiptap_json TEXT NOT NULL,
  publish_status TEXT DEFAULT 'draft' NOT NULL,
  hidden INTEGER DEFAULT 0 NOT NULL,
  pub_date DATETIME NOT NULL,
  cover_image_url TEXT,
  og_image_url TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id, locale)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT NOT NULL,
  locale TEXT NOT NULL,
  origin TEXT,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tiptap_json TEXT NOT NULL,
  publish_status TEXT DEFAULT 'draft' NOT NULL,
  hidden INTEGER DEFAULT 0 NOT NULL,
  project_status TEXT NOT NULL,
  duration TEXT NOT NULL,
  team_size INTEGER NOT NULL,
  role TEXT NOT NULL,
  project_order INTEGER NOT NULL,
  url TEXT,
  source_url TEXT,
  blog_url TEXT,
  cover_image_url TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id, locale)
);

CREATE TABLE IF NOT EXISTS developers (
  id TEXT NOT NULL,
  locale TEXT NOT NULL,
  origin TEXT,
  author_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  tiptap_json TEXT NOT NULL,
  avatar_url TEXT,
  github_url TEXT,
  email TEXT,
  website_url TEXT,
  tech_stack TEXT,
  certifications TEXT,
  education TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id, locale)
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL,
  post_locale TEXT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, post_locale, tag_id),
  FOREIGN KEY (post_id, post_locale) REFERENCES posts(id, locale) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_tags (
  project_id TEXT NOT NULL,
  project_locale TEXT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, project_locale, tag_id),
  FOREIGN KEY (project_id, project_locale) REFERENCES projects(id, locale) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(publish_status);
CREATE INDEX IF NOT EXISTS idx_posts_pub_date ON posts(pub_date);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(project_order);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(publish_status);
CREATE INDEX IF NOT EXISTS idx_developers_name ON developers(name);
