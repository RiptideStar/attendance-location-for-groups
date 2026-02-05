-- =============================================================================
-- MIGRATION: Add Organization SMTP Encryption Fields
-- =============================================================================
-- Stores IV and auth tag for AES-256-GCM encrypted SMTP passwords.
-- =============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS smtp_pass_iv TEXT,
  ADD COLUMN IF NOT EXISTS smtp_pass_tag TEXT;

