-- =============================================================================
-- SBS Migration 008 — Enforce one pending draft per customer
-- =============================================================================
-- A partial unique index on (profile_id) WHERE customer_status = 'pending'
-- guarantees at the database level that an authenticated customer can never
-- have more than one active draft, even under concurrent requests.
-- Guest quotes (profile_id IS NULL) are intentionally excluded.

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_requests_one_pending_draft_per_profile
  ON quote_requests (profile_id)
  WHERE profile_id IS NOT NULL
    AND customer_status = 'pending';
