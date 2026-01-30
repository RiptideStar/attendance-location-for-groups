# Attendance Location for Groups

Location-based QR code attendance system for general club/classes. Built with Next.js 16, Supabase, and deployed on Vercel.

## Features

- **QR Code Check-In**: Generate unique QR codes for each event
- **Location Verification**: Verify attendees are within 50m of event location using GPS
- **Time Windows**: Registration opens 15-30 min before and closes 15-30 min after events
- **Duplicate Prevention**: 24-hour cookie-based duplicate check-in prevention
- **Admin Portal**: Create, edit, delete events and view attendee data
- **Search & Filter**: Search attendees by name or email across all events
- **Countdown Timer**: Shows countdown before registration opens
- **Mobile-Responsive**: Optimized for mobile devices (primary use case)
 - **Credits Section**: Home screen shows contributors across Claude Builders Clubs

## Tech Stack

- **Framework**: Next.js 16+ (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js (Credentials) with multi-tenant organizations and JWT sessions
- **Styling**: Tailwind CSS
- **QR Codes**: qrcode.react
- **Maps**: Leaflet + OpenStreetMap (leaflet, react-leaflet, leaflet-geosearch)
- **Deployment**: Vercel

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Google Maps API key (optional, for location picker)

### 2. Clone and Install

```bash
cd claude-builders-club-upenn-attendance
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from [supabase/schema.sql](supabase/schema.sql)
3. Get your Supabase URL and keys from Project Settings > API

### 4. Configure Environment Variables

Copy [.env.example](.env.example) to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Note: No Google Maps key needed (Leaflet + OSM)
```

### 5. Run Multi-Tenant Migration

This app supports multiple organizations (clubs). Run the migration to create the `organizations` table and add org IDs to events/attendees. The migration may also seed an initial sample organization for development.

Requirements:
- Ensure these env vars are set in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

Run:

```bash
npm run migrate
```

If you see a message that direct SQL execution is unavailable, the script will write a ready-to-run SQL file at:

- [supabase/migrations/002_add_multi_tenant_support_ready.sql](supabase/migrations/002_add_multi_tenant_support_ready.sql)

Open your Supabase SQL Editor, paste the contents of that file, and execute it.



### 6. Add Event Timezone Column

Run the timezone migration so events store their IANA timezone:

- Execute [supabase/migrations/004_add_event_timezone.sql](supabase/migrations/004_add_event_timezone.sql) in the Supabase SQL Editor.

Note: If you haven't applied this migration yet, the app falls back to the viewer's browser timezone.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Admin Portal

1. If you don't have an organization yet, go to `/register` to create one.
2. Then go to `/login` and sign in with the credentials you created. You'll be redirected to your organization routes under `/:username`, e.g. `/yourorg/dashboard`.
3. Create a new event:
   - Enter event title
   - Set start and end times (ET timezone)
   - Pick a location on the map (Leaflet + OpenStreetMap) or enter coordinates
4. Download the generated QR code
5. Share QR code for your event

### Attendee Check-In

1. Scan the event QR code with phone camera
2. Wait for registration window to open (countdown shows time remaining)
3. Allow location permission when prompted
4. System verifies you're within 50m of event location
5. Enter your name and email
6. Submit to complete check-in

### View Attendees

- Per Event: Click "View Attendees" on an event in the dashboard
- Global Search: `/:username/attendees` (e.g. `/penncbc/attendees`) shows all attendees across events

## Project Structure

```
├── app/
│   ├── [username]/            # Multi-tenant org routes (dashboard, events, attendees)
│   ├── admin/                 # Legacy routes (redirected by middleware)
│   ├── api/                   # API routes (server-side, service role)
│   │   ├── attendance/        # Check-in API
│   │   ├── attendees/         # Attendee search API (org-scoped)
│   │   ├── auth/              # NextAuth
│   │   └── events/            # Event CRUD API (org-scoped)
│   ├── event/[eventId]/       # Public check-in page
│   └── login/                 # Admin login page
├── components/
│   ├── admin/                 # Admin components
│   └── event/                 # Public check-in components
├── lib/
│   ├── cookies/               # Cookie management
│   ├── geolocation/           # Location verification
│   ├── supabase/              # Supabase clients
│   └── utils/                 # Helper functions
├── supabase/
│   ├── schema.sql             # Base database schema
│   └── migrations/            # Incremental migrations
│       ├── 002_add_multi_tenant_support.sql
│       └── 004_add_event_timezone.sql
└── types/                     # TypeScript type definitions
```

## Key Files

- [supabase/schema.sql](supabase/schema.sql) - Base database schema
- [supabase/migrations/002_add_multi_tenant_support.sql](supabase/migrations/002_add_multi_tenant_support.sql) - Multi-tenant migration (script will produce a ready version)
- [supabase/migrations/004_add_event_timezone.sql](supabase/migrations/004_add_event_timezone.sql) - Event timezone column
- [middleware.ts](middleware.ts) - Org route protection and redirects
- [app/api/attendance/route.ts](app/api/attendance/route.ts) - Check-in API with validations
- [app/api/attendees/route.ts](app/api/attendees/route.ts) - Organization-scoped attendee API
- [app/event/[eventId]/page.tsx](app/event/[eventId]/page.tsx) - Public check-in flow
- [components/admin/AttendeeTable.tsx](components/admin/AttendeeTable.tsx) - Admin attendee table and filters
- [lib/geolocation/verification.ts](lib/geolocation/verification.ts) - Haversine distance calculation

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - Add all variables from `.env.local`
   - Keep `SUPABASE_SERVICE_ROLE_KEY` in Server-side env only (never exposed to browser)
   - Set `NEXT_PUBLIC_BASE_URL` to your production domain
4. Deploy!

## Configuration

### Time Windows

Default: 30 minutes before and after event times. Modify in database or when creating events.

### Location Radius

Default: 50 meters. Modify per-event in the database.

### Admin Credentials

Credentials are stored in the `organizations` table in Supabase and are managed by the app (registration and login). Use the Register page to create an organization. To rotate or reset a password, update it securely via your own admin flow or directly in the database.

## Troubleshooting

### Location not working

- Ensure user grants location permission
- Verify GPS is enabled on device
- HTTPS required in production for geolocation API

### Google Maps not loading

- Verify API key is correct
- Check that required APIs are enabled
- Ensure API key isn't restricted to wrong domain
- **Fallback**: System works with manual lat/lng entry if Maps API unavailable

### Database errors

- Verify Supabase credentials in `.env.local`
- Ensure schema.sql has been run in Supabase SQL Editor
- Check RLS policies are enabled

### “All Attendees” shows “Failed to fetch attendees”

- Ensure you are signed in (401 responses are surfaced as fetch errors)
- Apply the multi-tenant migration and the timezone migration:
   - [supabase/migrations/002_add_multi_tenant_support.sql](supabase/migrations/002_add_multi_tenant_support.sql)
   - [supabase/migrations/004_add_event_timezone.sql](supabase/migrations/004_add_event_timezone.sql)
- The API now gracefully handles missing timezone by falling back to the browser timezone, but applying the migration is recommended

### `npm run migrate` fails with code 127

- Run `npm install` to ensure dev dependencies (including `tsx`) are installed
- Make sure you are using a recent Node.js (v18+)
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

## Contributing

Contributions are welcome. Please:
- Open an issue to discuss significant changes
- Submit focused pull requests with clear descriptions
- Follow existing code style and TypeScript strictness
- Do not include secrets or production keys in commits

Add yourself to Credits by editing [lib/contributors.ts](lib/contributors.ts) with your club/name, affiliation, and link. The list renders on the home screen.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE).

## Support

For issues or questions, contact Penn Claude Builders Club.
