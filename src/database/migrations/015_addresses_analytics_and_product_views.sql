-- Delivery/payment metadata stays nullable so existing quotes, carts and orders remain valid.
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS address TEXT NULL;

ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT NULL;

ALTER TABLE cart_history
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS address TEXT NULL;

-- Daily aggregation prevents a row being created for every product page request.
CREATE TABLE IF NOT EXISTS product_view_daily (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_on DATE NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  PRIMARY KEY (product_id, viewed_on)
);

CREATE INDEX IF NOT EXISTS idx_product_view_daily_viewed_on ON product_view_daily(viewed_on);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_cart_history_created_at ON cart_history(created_at);
