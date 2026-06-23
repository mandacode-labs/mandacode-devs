-- Make certification issuer nullable so the admin can add a placeholder
-- entry and fill in the issuer later. The application-level zod schema
-- (src/lib/api/validation.ts) treats issuer as optional.
--
-- SQLite doesn't support ALTER COLUMN ... DROP NOT NULL, so we recreate
-- the table with the new schema and copy the data over.
-- Cloudflare D1 migration runner does not allow explicit transactions,
-- so the recreation is done as standalone DDL statements (each statement
-- is its own implicit transaction). On failure partway through, the
-- table may need to be manually cleaned up.

CREATE TABLE developer_certification_translations_new (
  certification_id TEXT NOT NULL REFERENCES developer_certifications(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT,
  date TEXT NOT NULL,
  badge_url TEXT,
  url TEXT,
  PRIMARY KEY (certification_id, locale)
);

INSERT INTO developer_certification_translations_new
SELECT certification_id, locale, name, issuer, date, badge_url, url
FROM developer_certification_translations;

DROP TABLE developer_certification_translations;

ALTER TABLE developer_certification_translations_new
RENAME TO developer_certification_translations;