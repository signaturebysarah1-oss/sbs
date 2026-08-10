-- Migration 011: Allow partial/draft products
-- Makes name, slug, and base_price nullable so products can be saved as
-- incomplete drafts. The NOT NULL constraint is enforced at the application
-- layer for published products only.

ALTER TABLE products
  ALTER COLUMN name      DROP NOT NULL,
  ALTER COLUMN slug      DROP NOT NULL,
  ALTER COLUMN base_price DROP NOT NULL;

-- Ensure the slug unique constraint still works with NULLs
-- (PostgreSQL treats each NULL as distinct, so multiple NULL slugs are fine)
