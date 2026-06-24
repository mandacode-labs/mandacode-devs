-- Rename tiptap content columns to domain-meaningful names:
--   tiptap_json        → article   (the main long-form prose)
--   tiptap_json_after  → body      (supplementary body)
--
-- The "tiptap" prefix referenced the editor library; that's an
-- implementation detail, not data semantics. "article" and "body"
-- describe what the content IS, not how it's stored.

ALTER TABLE post_translations      RENAME COLUMN tiptap_json       TO article;
ALTER TABLE project_translations   RENAME COLUMN tiptap_json       TO article;
ALTER TABLE developer_translations RENAME COLUMN tiptap_json       TO article;
ALTER TABLE developer_translations RENAME COLUMN tiptap_json_after TO body;
