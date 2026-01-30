-- =============================================================================
-- MIGRATION: Add Organization Locations (Favorites + Recents)
-- =============================================================================
-- Stores saved locations per organization for quick reuse when creating events.
-- Locations are auto-saved when events are created.
-- Users can mark locations as favorites for easy access.
-- =============================================================================

CREATE TABLE IF NOT EXISTS organization_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  use_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_location UNIQUE (organization_id, lat, lng)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_locations_org_id
  ON organization_locations(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_locations_org_favorite_recent
  ON organization_locations(organization_id, is_favorite DESC, last_used_at DESC);

-- Enable RLS
ALTER TABLE organization_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read organization_locations" ON organization_locations
  FOR SELECT USING (true);

CREATE POLICY "Organizations can manage own locations" ON organization_locations
  FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger (reuses existing function from migration 002)
DROP TRIGGER IF EXISTS update_org_locations_updated_at ON organization_locations;
CREATE TRIGGER update_org_locations_updated_at
  BEFORE UPDATE ON organization_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function for atomic upsert with counter increment
CREATE OR REPLACE FUNCTION upsert_organization_location(
  p_organization_id UUID,
  p_label TEXT,
  p_address TEXT,
  p_lat DECIMAL(10,8),
  p_lng DECIMAL(11,8)
) RETURNS void AS $$
BEGIN
  INSERT INTO organization_locations (organization_id, label, address, lat, lng, last_used_at, use_count)
  VALUES (p_organization_id, p_label, p_address, p_lat, p_lng, NOW(), 1)
  ON CONFLICT (organization_id, lat, lng)
  DO UPDATE SET
    last_used_at = NOW(),
    use_count = organization_locations.use_count + 1,
    address = EXCLUDED.address,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
