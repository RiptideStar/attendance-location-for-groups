-- =============================================================================
-- MIGRATION: Add Timezone Support to Events
-- =============================================================================
-- Stores the IANA timezone string (e.g., "America/New_York") with each event
-- so times display correctly regardless of the viewer's location.
-- Existing events default to "America/New_York" for backward compatibility.
-- =============================================================================

-- Add timezone column to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York';

-- Add timezone column to recurring_events
ALTER TABLE recurring_events
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York';
