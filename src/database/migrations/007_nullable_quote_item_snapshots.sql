-- Customer quotes may be saved while their product customisation is incomplete.
-- Keep product references and quantities intact, but make all descriptive and
-- pricing snapshots optional so a draft can progressively capture them.

ALTER TABLE quote_items
  ALTER COLUMN product_name_snapshot DROP NOT NULL,
  ALTER COLUMN unit_price_snapshot DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS size NUMERIC(5,2) NULL;
