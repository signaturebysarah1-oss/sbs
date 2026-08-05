-- Migration 009: Cart overhaul
-- Adds status lifecycle, snapshot columns, size_id, nullable product_id,
-- removes guest session columns, and creates cart_history table.

-- ─── 1. Drop guest-session constraints and columns ───────────────────────────
ALTER TABLE carts
  DROP CONSTRAINT IF EXISTS carts_owner_check,
  DROP CONSTRAINT IF EXISTS carts_session_id_unique,
  DROP CONSTRAINT IF EXISTS carts_profile_id_unique;

DROP INDEX IF EXISTS idx_carts_session_id;
DROP INDEX IF EXISTS idx_carts_expires_at;

ALTER TABLE carts
  DROP COLUMN IF EXISTS session_id,
  DROP COLUMN IF EXISTS expires_at;

-- ─── 2. Add status to carts ───────────────────────────────────────────────────
ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

ALTER TABLE carts
  ADD CONSTRAINT carts_status_check
    CHECK (status IN ('active', 'submitted', 'abandoned'));

-- One active cart per authenticated user (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_profile_id_active
  ON carts(profile_id)
  WHERE profile_id IS NOT NULL AND status = 'active';

-- profile_id is now required for authenticated carts
ALTER TABLE carts
  ALTER COLUMN profile_id SET NOT NULL;

-- ─── 3. cart_items: add missing columns ──────────────────────────────────────
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS size_id               UUID          NULL,
  ADD COLUMN IF NOT EXISTS image_url_snapshot    TEXT          NULL,
  ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT          NULL,
  ADD COLUMN IF NOT EXISTS selected_color        TEXT          NULL,
  ADD COLUMN IF NOT EXISTS selected_material     TEXT          NULL,
  ADD COLUMN IF NOT EXISTS selected_size         NUMERIC(6,2)  NULL;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_size_id_fkey
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE SET NULL;

-- ─── 4. Make cart_items.product_id nullable ───────────────────────────────────
ALTER TABLE cart_items
  ALTER COLUMN product_id DROP NOT NULL;

-- ─── 5. cart_history table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_history (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  original_cart_id  UUID          NULL,
  profile_id        UUID          NOT NULL,
  items             JSONB         NOT NULL DEFAULT '[]',
  total_snapshot    NUMERIC(12,2) NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT cart_history_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_history_profile_id ON cart_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_cart_history_original_cart_id ON cart_history(original_cart_id);
