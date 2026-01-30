# Recurring Events Setup Instructions

This guide explains how to set up the recurring events feature for your attendance system.

## Database Migration

To enable recurring events, you need to run the database migration in your Supabase SQL editor.

### Steps:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the migration file: `supabase/migrations/001_add_recurring_events.sql`
4. Copy the entire contents of the file
5. Paste it into the SQL Editor
6. Click "Run" to execute the migration

This will:
- Create the `recurring_events` table
- Add a `recurring_event_id` column to the `events` table
- Set up appropriate indexes and triggers
- Configure Row Level Security (RLS) policies

## Features

Once the migration is applied, you'll be able to:

### Create Recurring Events
- Navigate to Admin Dashboard → "Create Recurring Event"
- Choose from three recurrence patterns:
  - **Weekly**: Repeat on specific days of the week (e.g., every Monday and Wednesday)
  - **Monthly (specific date)**: Repeat on a specific day of the month (e.g., 15th of every month)
  - **Monthly (specific weekday)**: Repeat on a specific weekday pattern (e.g., 2nd Tuesday of every month)

### Manage Recurring Events
- View all recurring events at Admin Dashboard → "Recurring Events"
- See how many event instances have been generated from each pattern
- Delete recurring events (this will also delete all generated event instances)

### How It Works
When you create a recurring event:
1. A recurring event template is saved with the pattern details
2. Individual event instances are automatically generated based on the pattern
3. Each generated event can be managed independently (edited, closed, etc.)
4. All generated events are linked to their recurring event parent

### Important Notes
- Events are generated upfront (up to 100 occurrences by default)
- Each generated event is a full event with its own QR code and attendee tracking
- Deleting a recurring event will delete ALL its generated instances
- Individual event instances can be edited or deleted independently without affecting the recurring pattern

## Troubleshooting

If you encounter issues:
1. Make sure you're running the migration on the correct Supabase project
2. Check that the base schema (events and attendees tables) exists
3. Review the Supabase SQL Editor output for any error messages
4. Ensure you have the necessary permissions to modify the database schema

## API Endpoints

The following API endpoints have been added:
- `GET /api/recurring-events` - List all recurring events
- `POST /api/recurring-events` - Create a new recurring event
- `GET /api/recurring-events/[id]` - Get a specific recurring event
- `DELETE /api/recurring-events/[id]` - Delete a recurring event and its instances
