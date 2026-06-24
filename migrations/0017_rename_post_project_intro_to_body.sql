-- Rename `intro` column to `body` in post and project translations.
-- Post and project have only ONE body section (their main content),
-- so calling it 'intro' (서론) was wrong — it's their main body
-- (본문). The developer profile keeps both `intro` and `body` columns
-- because it has two distinct sections (서론 + 본론).

ALTER TABLE post_translations    RENAME COLUMN intro TO body;
ALTER TABLE project_translations RENAME COLUMN intro TO body;
