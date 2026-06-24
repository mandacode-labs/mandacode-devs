-- Drop the unused url column from developer_certification_translations.
-- The badge_url field is sufficient — no separate verification link is
-- stored anymore (see PR #69).
--
-- SQLite doesn't support DROP COLUMN reliably across older versions, so
-- we recreate the table without the column and copy the data over.
-- Cloudflare D1 migration runner does not allow explicit transactions,
-- so the recreation is done as standalone DDL statements (each statement
-- is its own implicit transaction).

CREATE TABLE developer_certification_translations_new (
  certification_id TEXT NOT NULL REFERENCES developer_certifications(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT,
  date TEXT NOT NULL,
  badge_url TEXT,
  PRIMARY KEY (certification_id, locale)
);

INSERT INTO developer_certification_translations_new
SELECT certification_id, locale, name, issuer, date, badge_url
FROM developer_certification_translations;

DROP TABLE developer_certification_translations;

ALTER TABLE developer_certification_translations_new
RENAME TO developer_certification_translations;