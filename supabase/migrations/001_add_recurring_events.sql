-- Migration: Add recurring events support
-- This migration adds a recurring_events table and updates the events table
-- to support recurring event patterns

-- =============================================================================
-- CREATE RECURRING EVENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS recurring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event template details
  title TEXT NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,

  -- Event timing (time of day + duration)
  start_time TIME NOT NULL, -- Time of day for events
  duration_minutes INTEGER NOT NULL, -- Duration in minutes

  -- Recurrence pattern
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('weekly', 'monthly_date', 'monthly_weekday')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1, -- e.g., every 2 weeks

  -- For weekly: days of week (0=Sunday, 6=Saturday)
  recurrence_days INTEGER[] DEFAULT NULL,

  -- For monthly_date: day of month (1-31)
  recurrence_monthly_date INTEGER DEFAULT NULL CHECK (recurrence_monthly_date BETWEEN 1 AND 31),

  -- For monthly_weekday: e.g., "2" for 2nd, "weekday" for which day (0-6)
  recurrence_monthly_week INTEGER DEFAULT NULL CHECK (recurrence_monthly_week BETWEEN 1 AND 5), -- 1st, 2nd, 3rd, 4th, 5th
  recurrence_monthly_weekday INTEGER DEFAULT NULL CHECK (recurrence_monthly_weekday BETWEEN 0 AND 6), -- 0=Sun, 6=Sat

  -- Date range for recurrence
  start_date DATE NOT NULL, -- When to start generating events
  end_date DATE DEFAULT NULL, -- NULL = no end date, or specific end date

  -- Event settings
  registration_window_before_minutes INTEGER DEFAULT 30,
  registration_window_after_minutes INTEGER DEFAULT 30,
  location_radius_meters INTEGER DEFAULT 50,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_weekly_recurrence CHECK (
    recurrence_type != 'weekly' OR recurrence_days IS NOT NULL
  ),
  CONSTRAINT valid_monthly_date_recurrence CHECK (
    recurrence_type != 'monthly_date' OR recurrence_monthly_date IS NOT NULL
  ),
  CONSTRAINT valid_monthly_weekday_recurrence CHECK (
    recurrence_type != 'monthly_weekday' OR
    (recurrence_monthly_week IS NOT NULL AND recurrence_monthly_weekday IS NOT NULL)
  )
);

-- =============================================================================
-- UPDATE EVENTS TABLE
-- =============================================================================

-- Add recurring_event_id to link generated events to their recurring pattern
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurring_event_id UUID REFERENCES recurring_events(id) ON DELETE SET NULL;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_recurring_event_id ON events(recurring_event_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to automatically update updated_at on recurring_events table
DROP TRIGGER IF EXISTS update_recurring_events_updated_at ON recurring_events;
CREATE TRIGGER update_recurring_events_updated_at
  BEFORE UPDATE ON recurring_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on recurring_events
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read recurring_events" ON recurring_events;
DROP POLICY IF EXISTS "Admin can do everything on recurring_events" ON recurring_events;

-- Policy: Allow public read access to recurring_events
CREATE POLICY "Public can read recurring_events" ON recurring_events
  FOR SELECT USING (true);

-- Policy: Allow all operations on recurring_events (admin operations)
-- Note: In production, add proper auth checks
CREATE POLICY "Admin can do everything on recurring_events" ON recurring_events
  FOR ALL USING (true);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index on recurring_events for efficient queries
CREATE INDEX IF NOT EXISTS idx_recurring_events_start_date ON recurring_events(start_date);
CREATE INDEX IF NOT EXISTS idx_recurring_events_end_date ON recurring_events(end_date);
CREATE INDEX IF NOT EXISTS idx_recurring_events_type ON recurring_events(recurrence_type);
