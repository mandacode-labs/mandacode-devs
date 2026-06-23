-- Education status is now a closed enum: graduated | enrolled | withdrawn.
-- Existing non-null values are forced to "graduated" per product decision.
-- NULL values are left NULL (admin fills them in by hand).
-- The DB-level column remains TEXT for SQLite portability; enforcement
-- happens at the application layer via zod enum in src/lib/api/validation.ts.

UPDATE developer_education_translations
SET status = 'graduated'
WHERE status IS NOT NULL;