-- Migration: Add email templates and send tracking
-- Description: Adds tables for reusable email templates and tracking sent emails

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_html BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for organization lookup
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);

-- Email sends tracking table
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  attendee_email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to prevent duplicate sends
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sends_unique ON email_sends(template_id, attendee_email);

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_email_sends_template ON email_sends(template_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_email ON email_sends(attendee_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_org ON email_sends(organization_id);

-- Trigger to update updated_at on email_templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- RLS policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Organizations can manage their own templates
CREATE POLICY "Organizations can view own templates"
  ON email_templates FOR SELECT
  USING (organization_id = organization_id);

CREATE POLICY "Organizations can insert own templates"
  ON email_templates FOR INSERT
  WITH CHECK (organization_id = organization_id);

CREATE POLICY "Organizations can update own templates"
  ON email_templates FOR UPDATE
  USING (organization_id = organization_id);

CREATE POLICY "Organizations can delete own templates"
  ON email_templates FOR DELETE
  USING (organization_id = organization_id);

-- RLS policies for email_sends
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view own email sends"
  ON email_sends FOR SELECT
  USING (organization_id = organization_id);

CREATE POLICY "Organizations can insert own email sends"
  ON email_sends FOR INSERT
  WITH CHECK (organization_id = organization_id);
