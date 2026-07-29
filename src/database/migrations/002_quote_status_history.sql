-- =============================================================================
-- Signature by Sarah (SBS) — Phase 6 Migration
-- Adds: quote_status_history
-- =============================================================================

CREATE TABLE quote_status_history (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id   UUID          NOT NULL,
  old_status         VARCHAR(30)   NULL,
  new_status         VARCHAR(30)   NOT NULL,
  changed_by         UUID          NULL,
  note               TEXT          NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT quote_status_history_quote_request_id_fkey
    FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE CASCADE,

  CONSTRAINT quote_status_history_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL,

  CONSTRAINT quote_status_history_new_status_check
    CHECK (new_status IN ('pending', 'reviewing', 'approved', 'completed', 'cancelled'))
);

CREATE INDEX idx_quote_status_history_quote_request_id
  ON quote_status_history(quote_request_id);

CREATE INDEX idx_quote_status_history_created_at
  ON quote_status_history(created_at);

CREATE INDEX idx_quote_status_history_changed_by
  ON quote_status_history(changed_by);
