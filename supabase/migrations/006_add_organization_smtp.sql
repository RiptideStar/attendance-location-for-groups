-- =============================================================================
-- MIGRATION: Add Organization SMTP Settings
-- =============================================================================
-- Adds per-organization SMTP configuration so each org can send from its own
-- email address.
-- =============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS smtp_host TEXT,
  ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
  ADD COLUMN IF NOT EXISTS smtp_user TEXT,
  ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
  ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN,
  ADD COLUMN IF NOT EXISTS smtp_from_email TEXT,
  ADD COLUMN IF NOT EXISTS smtp_from_name TEXT,
  ADD COLUMN IF NOT EXISTS smtp_reply_to TEXT;

