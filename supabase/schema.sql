-- Penn CBC Attendance System Database Schema
-- This file contains the complete database schema for the attendance system
-- Run this file in your Supabase SQL editor to set up the database

-- =============================================================================
-- TABLES
-- =============================================================================

-- Events table: Stores information about each event
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  registration_window_before_minutes INTEGER DEFAULT 30,
  registration_window_after_minutes INTEGER DEFAULT 30,
  location_radius_meters INTEGER DEFAULT 50,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendees table: Stores attendance records for each event
CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_in_lat DECIMAL(10, 8) NOT NULL,
  check_in_lng DECIMAL(11, 8) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index on events start_time for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- Index on events end_time
CREATE INDEX IF NOT EXISTS idx_events_end_time ON events(end_time);

-- Index on attendees event_id for efficient event-specific queries
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);

-- Index on attendees email for efficient email searches
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);

-- Index on attendees name for efficient name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees(LOWER(name));

-- Index on attendees check_in_time
CREATE INDEX IF NOT EXISTS idx_attendees_check_in_time ON attendees(check_in_time);

-- Composite index for event + email lookups
CREATE INDEX IF NOT EXISTS idx_attendees_event_email ON attendees(event_id, email);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on both tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Public can read events" ON events;
DROP POLICY IF EXISTS "Public can insert attendance" ON attendees;
DROP POLICY IF EXISTS "Public can read attendees" ON attendees;
DROP POLICY IF EXISTS "Admin can do everything on events" ON events;
DROP POLICY IF EXISTS "Admin can do everything on attendees" ON attendees;

-- Policy: Allow public read access to events (needed for check-in page)
CREATE POLICY "Public can read events" ON events
  FOR SELECT USING (true);

-- Policy: Allow public insert on attendees (for check-in)
CREATE POLICY "Public can insert attendance" ON attendees
  FOR INSERT WITH CHECK (true);

-- Policy: Allow public read on attendees (for filtering and display)
-- Note: In production, you may want to restrict this based on auth
CREATE POLICY "Public can read attendees" ON attendees
  FOR SELECT USING (true);

-- Policy: Allow all operations on events (admin operations)
-- Note: In production, add proper auth checks
CREATE POLICY "Admin can do everything on events" ON events
  FOR ALL USING (true);

-- Policy: Allow all operations on attendees (admin operations)
-- Note: In production, add proper auth checks
CREATE POLICY "Admin can do everything on attendees" ON attendees
  FOR ALL USING (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPFUL QUERIES FOR DEVELOPMENT
-- =============================================================================

-- Query to get all events with attendee counts
-- SELECT
--   e.id,
--   e.title,
--   e.start_time,
--   e.end_time,
--   e.location_address,
--   e.is_closed,
--   COUNT(a.id) as attendee_count
-- FROM events e
-- LEFT JOIN attendees a ON e.id = a.event_id
-- GROUP BY e.id
-- ORDER BY e.start_time DESC;

-- Query to search attendees by name or email
-- SELECT
--   a.name,
--   a.email,
--   a.check_in_time,
--   e.title as event_title,
--   e.start_time as event_start
-- FROM attendees a
-- JOIN events e ON a.event_id = e.id
-- WHERE LOWER(a.name) LIKE LOWER('%search_term%')
--   OR LOWER(a.email) LIKE LOWER('%search_term%')
-- ORDER BY a.check_in_time DESC;

-- Query to get all events a specific person attended
-- SELECT
--   e.title,
--   e.start_time,
--   e.location_address,
--   a.check_in_time
-- FROM attendees a
-- JOIN events e ON a.event_id = e.id
-- WHERE LOWER(a.email) = LOWER('user@example.com')
-- ORDER BY e.start_time DESC;
