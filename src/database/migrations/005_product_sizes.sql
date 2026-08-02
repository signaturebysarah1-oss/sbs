-- Reusable size catalogue and product-size availability.
-- Product sizes intentionally do not use product_variants.

CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sizes_value_unique UNIQUE (value),
  CONSTRAINT sizes_value_check CHECK (value >= 0)
);

CREATE TABLE IF NOT EXISTS product_sizes (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
  price_adjustment NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT product_sizes_pkey PRIMARY KEY (product_id, size_id)
);

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS size_id UUID NULL REFERENCES sizes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_size_id ON product_sizes(size_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_size_id ON cart_items(size_id);

DROP TRIGGER IF EXISTS trg_sizes_updated_at ON sizes;
CREATE TRIGGER trg_sizes_updated_at BEFORE UPDATE ON sizes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
