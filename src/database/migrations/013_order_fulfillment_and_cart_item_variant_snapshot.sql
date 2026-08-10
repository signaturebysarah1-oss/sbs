-- Adds optional fulfillment data for customer tracking and preserves a cart
-- variant label independently of the currently configured product catalog.

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS variant_label_snapshot VARCHAR(255) NULL;

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS shipping_tracking_number VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS shipping_tracking_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS shipping_details JSONB NULL;

ALTER TABLE cart_history
  ADD COLUMN IF NOT EXISTS shipping_tracking_number VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS shipping_tracking_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS shipping_details JSONB NULL;
