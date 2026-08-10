-- Allows every product-content/configuration field to remain NULL while an
-- administrator is progressively building a draft. Status and system-managed
-- identifiers/timestamps remain required for lifecycle and database integrity.

ALTER TABLE products
  ALTER COLUMN is_customizable DROP NOT NULL,
  ALTER COLUMN is_featured DROP NOT NULL,
  ALTER COLUMN is_hero DROP NOT NULL,
  ALTER COLUMN sort_order DROP NOT NULL;
