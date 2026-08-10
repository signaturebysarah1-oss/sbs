-- Migration 012: Order numbers, payment/receipt, flexible status, cart order history
-- Adds order_number to cart_history, payment/receipt fields to both quote_requests
-- and cart_history, flexible (non-enum) status for cart orders, cart order status
-- history table, and email notification settings.

-- ─── 1. cart_history: order number, payment, receipt, status ─────────────────
ALTER TABLE cart_history
  ADD COLUMN IF NOT EXISTS order_number   VARCHAR(50)   NULL,
  ADD COLUMN IF NOT EXISTS status         TEXT          NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS contact_method VARCHAR(20)   NULL,
  ADD COLUMN IF NOT EXISTS payment_url    TEXT          NULL,
  ADD COLUMN IF NOT EXISTS receipt_url    TEXT          NULL,
  ADD COLUMN IF NOT EXISTS receipt_public_id VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_history_order_number
  ON cart_history(order_number)
  WHERE order_number IS NOT NULL;

-- ─── 2. quote_requests: payment and receipt fields ────────────────────────────
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS payment_url       TEXT          NULL,
  ADD COLUMN IF NOT EXISTS receipt_url       TEXT          NULL,
  ADD COLUMN IF NOT EXISTS receipt_public_id VARCHAR(255)  NULL;

-- ─── 3. Remove restrictive status enum from quote_requests ───────────────────
-- The existing CHECK constraint limits statuses to a fixed list.
-- We keep the existing values but allow the admin to use any non-empty string.
ALTER TABLE quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_status_check;

-- ─── 4. Remove restrictive status enum from quote_status_history ─────────────
ALTER TABLE quote_status_history
  DROP CONSTRAINT IF EXISTS quote_status_history_new_status_check;

-- ─── 5. cart_order_status_history table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_order_status_history (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_history_id   UUID          NOT NULL,
  old_status        TEXT          NULL,
  new_status        TEXT          NOT NULL,
  changed_by        UUID          NULL,
  note              TEXT          NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT cart_order_status_history_cart_history_id_fkey
    FOREIGN KEY (cart_history_id) REFERENCES cart_history(id) ON DELETE CASCADE,

  CONSTRAINT cart_order_status_history_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_order_status_history_cart_history_id
  ON cart_order_status_history(cart_history_id);

-- ─── 6. Settings: add email notification and payment keys ────────────────────
-- Extend the group_name check to include 'notifications' and 'payment'
ALTER TABLE settings
  DROP CONSTRAINT IF EXISTS settings_group_name_check;

ALTER TABLE settings
  ADD CONSTRAINT settings_group_name_check
    CHECK (group_name IN ('general', 'hero', 'footer', 'social', 'contact', 'notifications', 'payment'));

-- Seed notification and payment settings
INSERT INTO settings (key, value, group_name, label, description, is_public) VALUES
  ('notify_customer_on_quote',       'true',  'notifications', 'Customer Quote Email',        'Send confirmation email to customer on quote submission',    false),
  ('notify_admin_on_quote',          'true',  'notifications', 'Admin Quote Email',           'Send notification email to admin on quote submission',       false),
  ('notify_customer_on_cart',        'true',  'notifications', 'Customer Cart Email',         'Send confirmation email to customer on cart submission',     false),
  ('notify_admin_on_cart',           'true',  'notifications', 'Admin Cart Email',            'Send notification email to admin on cart submission',        false),
  ('notify_customer_on_contact',     'true',  'notifications', 'Customer Contact Email',      'Send confirmation email to customer on contact submission',  false),
  ('notify_admin_on_contact',        'true',  'notifications', 'Admin Contact Email',         'Send notification email to admin on contact submission',     false),
  ('notify_customer_on_academy',     'true',  'notifications', 'Customer Academy Email',      'Send confirmation email to applicant on academy registration', false),
  ('notify_admin_on_academy',        'true',  'notifications', 'Admin Academy Email',         'Send notification email to admin on academy registration',   false),
  ('notify_customer_on_order_status','true',  'notifications', 'Customer Order Status Email', 'Send email to customer when order status changes',           false),
  ('notification_email',             NULL,    'notifications', 'Notification Email',          'Override recipient address for all admin notifications',     false),
  ('payment_instructions',           NULL,    'payment',       'Payment Instructions',        'Payment instructions shown to customers',                    true),
  ('payment_bank_name',              NULL,    'payment',       'Bank Name',                   'Bank name for payment',                                      true),
  ('payment_account_number',         NULL,    'payment',       'Account Number',              'Account number for payment',                                 true),
  ('payment_account_name',           NULL,    'payment',       'Account Name',                'Account name for payment',                                   true)
ON CONFLICT (key) DO NOTHING;
