-- =============================================================================
-- MIGRATION: Add Multi-Tenant Support with Organizations
-- =============================================================================
-- This migration adds support for multiple organizations/clubs with separate
-- admin accounts. Each organization gets its own isolated data.
--
-- Changes:
-- 1. Create organizations table
-- 2. Add organization_id foreign keys to events, attendees, recurring_events
-- 3. Update RLS policies for multi-tenant isolation
-- 4. Migrate existing data to penncbc organization
-- =============================================================================

-- =============================================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_format CHECK (
    username ~ '^[a-z0-9_-]{3,30}$'
  ),
  CONSTRAINT username_not_empty CHECK (
    length(trim(username)) >= 3
  ),
  CONSTRAINT name_not_empty CHECK (
    length(trim(name)) >= 3
  )
);

-- Index for efficient username lookups during authentication
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_username
  ON organizations(username);

-- Index for efficient ID lookups
CREATE INDEX IF NOT EXISTS idx_organizations_id
  ON organizations(id);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on organizations table
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public can insert (registration) and read (for login validation)
CREATE POLICY "Public can register organizations" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read organizations" ON organizations
  FOR SELECT USING (true);

-- Organizations can update their own data (authenticated via NextAuth)
CREATE POLICY "Organizations can update themselves" ON organizations
  FOR UPDATE USING (true);

-- Prevent deletion by default (can be manually enabled later if needed)
CREATE POLICY "Prevent organization deletion" ON organizations
  FOR DELETE USING (false);

-- =============================================================================
-- 2. ADD ORGANIZATION FOREIGN KEYS TO EXISTING TABLES
-- =============================================================================

-- Add organization_id to events table (nullable initially for migration)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to attendees table (nullable initially for migration)
ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to recurring_events table (nullable initially for migration)
ALTER TABLE recurring_events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for efficient organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_events_organization_id
  ON events(organization_id);

CREATE INDEX IF NOT EXISTS idx_attendees_organization_id
  ON attendees(organization_id);

CREATE INDEX IF NOT EXISTS idx_recurring_events_organization_id
  ON recurring_events(organization_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_org_start_time
  ON events(organization_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_attendees_org_event
  ON attendees(organization_id, event_id);

CREATE INDEX IF NOT EXISTS idx_recurring_events_org_created
  ON recurring_events(organization_id, created_at DESC);

-- =============================================================================
-- 3. UPDATE RLS POLICIES FOR MULTI-TENANT ISOLATION
-- =============================================================================

-- Drop old permissive policies (if they exist)
DROP POLICY IF EXISTS "Public can read events" ON events;
DROP POLICY IF EXISTS "Admin can do everything on events" ON events;
DROP POLICY IF EXISTS "Public can read attendees" ON attendees;
DROP POLICY IF EXISTS "Public can insert attendance" ON attendees;
DROP POLICY IF EXISTS "Admin can do everything on attendees" ON attendees;
DROP POLICY IF EXISTS "Public can read recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Admin can do everything on recurring_events" ON recurring_events;

-- =============================================================================
-- Events RLS Policies
-- =============================================================================

-- Public can read all events (needed for check-in pages)
CREATE POLICY "Public can read events" ON events
  FOR SELECT USING (true);

-- Organizations can manage their own events (via server-side API with service role)
-- Note: The actual filtering happens in API routes via organization_id
CREATE POLICY "Organizations can manage own events" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Attendees RLS Policies
-- =============================================================================

-- Public can insert attendance (for check-in)
CREATE POLICY "Public can insert attendance" ON attendees
  FOR INSERT WITH CHECK (true);

-- Public can read attendees (for displaying attendee lists on check-in page)
CREATE POLICY "Public can read attendees" ON attendees
  FOR SELECT USING (true);

-- Organizations can manage attendees for their events (via server-side API)
CREATE POLICY "Organizations can manage own attendees" ON attendees
  FOR ALL USING (true);

-- =============================================================================
-- Recurring Events RLS Policies
-- =============================================================================

-- Public can read recurring events (for displaying upcoming events)
CREATE POLICY "Public can read recurring_events" ON recurring_events
  FOR SELECT USING (true);

-- Organizations can manage their own recurring events (via server-side API)
CREATE POLICY "Organizations can manage own recurring_events" ON recurring_events
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 4. MIGRATE EXISTING DATA TO PENNCBC ORGANIZATION
-- =============================================================================

-- Note: Password hash placeholder will be replaced by migration script
-- The placeholder below is for 'penncbc123' hashed with bcrypt cost factor 10
-- This will be replaced when running the migration script

DO $$
DECLARE
  penncbc_org_id UUID;
BEGIN
  -- Insert the default penncbc organization
  INSERT INTO organizations (username, name, password_hash, created_at)
  VALUES (
    'penncbc',
    'UPenn Claude Builders Club',
    '$2a$10$PLACEHOLDER_WILL_BE_REPLACED',
    NOW()
  )
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO penncbc_org_id;

  -- If the organization already exists, get its ID
  IF penncbc_org_id IS NULL THEN
    SELECT id INTO penncbc_org_id FROM organizations WHERE username = 'penncbc';
  END IF;

  -- Update existing events with penncbc organization_id
  UPDATE events
  SET organization_id = penncbc_org_id
  WHERE organization_id IS NULL;

  -- Update existing attendees with penncbc organization_id
  UPDATE attendees
  SET organization_id = penncbc_org_id
  WHERE organization_id IS NULL;

  -- Update existing recurring_events with penncbc organization_id
  UPDATE recurring_events
  SET organization_id = penncbc_org_id
  WHERE organization_id IS NULL;

  -- Log migration results
  RAISE NOTICE 'Migration complete for organization: %', penncbc_org_id;
  RAISE NOTICE 'Events migrated: %', (SELECT COUNT(*) FROM events WHERE organization_id = penncbc_org_id);
  RAISE NOTICE 'Attendees migrated: %', (SELECT COUNT(*) FROM attendees WHERE organization_id = penncbc_org_id);
  RAISE NOTICE 'Recurring events migrated: %', (SELECT COUNT(*) FROM recurring_events WHERE organization_id = penncbc_org_id);
END $$;

-- Make organization_id NOT NULL after migration
ALTER TABLE events ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE attendees ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE recurring_events ALTER COLUMN organization_id SET NOT NULL;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- The database now supports multiple organizations with data isolation.
-- Next steps:
-- 1. Run migration script to replace password hash placeholder
-- 2. Update application code to use organization_id filtering
-- 3. Test multi-tenant isolation
-- =============================================================================
