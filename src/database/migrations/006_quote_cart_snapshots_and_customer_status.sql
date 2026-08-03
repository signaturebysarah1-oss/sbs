-- Preserves product presentation details at the time a cart or quote item is created.
-- customer_status is deliberately separate from quote_requests.status, which remains
-- the admin review workflow status.

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

UPDATE materials
SET slug = trim(both '-' FROM lower(regexp_replace(name, '[^a-z0-9]+', '-', 'g')))
WHERE slug IS NULL;

ALTER TABLE materials
  ALTER COLUMN slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_materials_slug ON materials(slug);

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS image_url_snapshot TEXT NULL;

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS customer_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD CONSTRAINT quote_requests_customer_status_check
    CHECK (customer_status IN ('pending', 'completed'));

-- Before this migration, POST /api/quotes represented immediate submission.
-- Treat those historical records as submitted so they do not become editable
-- customer drafts merely because the new lifecycle field was introduced.
UPDATE quote_requests
SET customer_status = 'completed';

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS image_url_snapshot TEXT NULL,
  ADD COLUMN IF NOT EXISTS shoe_name_snapshot VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS toe_style_snapshot VARCHAR(255) NULL;
