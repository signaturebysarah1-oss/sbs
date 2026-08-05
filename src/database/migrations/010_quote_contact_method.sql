-- Migration 010: Add contact_method to quote_requests
-- Stores how the customer wants to be contacted after submitting a quote.

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS contact_method VARCHAR(20) NULL;

ALTER TABLE quote_requests
  ADD CONSTRAINT quote_requests_contact_method_check
    CHECK (contact_method IN ('email', 'whatsapp'));
