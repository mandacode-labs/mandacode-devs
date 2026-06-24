-- Developer profile gets a second tiptap body rendered after the
-- main sections (TechStack / Certifications / Education / ProjectTimeline).
-- Existing rows default to an empty doc and can be filled in via the
-- admin editor.
ALTER TABLE developer_translations
  ADD COLUMN tiptap_json_after TEXT NOT NULL DEFAULT '{"type":"doc","content":[]}';
