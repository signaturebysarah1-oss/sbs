-- Adds an optional, free-form product category label.
-- Collections remain a separate many-to-many catalog relationship.

ALTER TABLE products
  ADD COLUMN category VARCHAR(100) NULL;
