-- Developer certifications: identity + per-locale translations (multi-locale)
-- Identity table holds shared ordering; translations hold locale-specific text.
CREATE TABLE developer_certifications (
  id TEXT PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_developer_certifications_developer_id ON developer_certifications(developer_id);
CREATE INDEX idx_developer_certifications_order ON developer_certifications(developer_id, order_index);

CREATE TABLE developer_certification_translations (
  certification_id TEXT NOT NULL REFERENCES developer_certifications(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  date TEXT NOT NULL,
  badge_url TEXT,
  url TEXT,
  PRIMARY KEY (certification_id, locale)
);
CREATE INDEX idx_developer_certification_translations_locale ON developer_certification_translations(locale);

-- Developer education: identity (start_date/end_date) + per-locale translations
-- Dates are stored in the identity table (same across locales); translations hold locale-specific institution/department/status.
CREATE TABLE developer_education (
  id TEXT PRIMARY KEY,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  start_date TEXT,
  end_date TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_developer_education_developer_id ON developer_education(developer_id);
CREATE INDEX idx_developer_education_order ON developer_education(developer_id, order_index);

CREATE TABLE developer_education_translations (
  education_id TEXT NOT NULL REFERENCES developer_education(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  institution TEXT NOT NULL,
  department TEXT,
  status TEXT,
  PRIMARY KEY (education_id, locale)
);
CREATE INDEX idx_developer_education_translations_locale ON developer_education_translations(locale);

-- Data is intentionally NOT seeded. The developer will populate it through
-- the admin UI.
