# Penn CBC Attendance System

Location-based QR code attendance system for Penn Claude Builders Club events. Built with Next.js 16, Supabase, and deployed on Vercel.

## Features

- **QR Code Check-In**: Generate unique QR codes for each event
- **Location Verification**: Verify attendees are within 50m of event location using GPS
- **Time Windows**: Registration opens 15-30 min before and closes 15-30 min after events
- **Duplicate Prevention**: 24-hour cookie-based duplicate check-in prevention
- **Admin Portal**: Create, edit, delete events and view attendee data
- **Search & Filter**: Search attendees by name or email across all events
- **Countdown Timer**: Shows countdown before registration opens
- **Mobile-Responsive**: Optimized for mobile devices (primary use case)

## Tech Stack

- **Framework**: Next.js 16+ (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js with hardcoded credentials
- **Styling**: Tailwind CSS
- **QR Codes**: qrcode.react
- **Maps**: Google Maps API (for admin location picker)
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

### 4. Get Google Maps API Key (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key and restrict it to your domain

### 5. Configure Environment Variables

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

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Admin Credentials
ADMIN_USERNAME=penncbc
ADMIN_PASSWORD=penncbc123
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Admin Portal

1. Navigate to `/admin`
2. Login with credentials: `penncbc` / `penncbc123`
3. Create a new event:
   - Enter event title
   - Set start and end times (ET timezone)
   - Select location using Google Maps or manual coordinates
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

- **Per Event**: Click "View Attendees" on an event in the admin dashboard
- **Global Search**: Go to "All Attendees" tab to search across all events

## Project Structure

```
├── app/
│   ├── admin/                 # Admin portal pages
│   ├── api/                   # API routes
│   │   ├── attendance/        # Check-in API
│   │   ├── attendees/         # Attendee search API
│   │   ├── auth/              # NextAuth
│   │   └── events/            # Event CRUD API
│   └── event/[eventId]/       # Public check-in page
├── components/
│   ├── admin/                 # Admin components
│   └── event/                 # Public check-in components
├── lib/
│   ├── cookies/               # Cookie management
│   ├── geolocation/           # Location verification
│   ├── supabase/              # Supabase clients
│   └── utils/                 # Helper functions
├── supabase/
│   └── schema.sql             # Database schema
└── types/                     # TypeScript type definitions
```

## Key Files

- [supabase/schema.sql](supabase/schema.sql) - Database schema
- [app/api/attendance/route.ts](app/api/attendance/route.ts) - Check-in API with validations
- [app/event/[eventId]/page.tsx](app/event/[eventId]/page.tsx) - Public check-in flow
- [app/admin/page.tsx](app/admin/page.tsx) - Admin dashboard
- [lib/geolocation/verification.ts](lib/geolocation/verification.ts) - Haversine distance calculation

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - Add all variables from `.env.local`
   - Set `NEXT_PUBLIC_BASE_URL` to your production domain
4. Deploy!

## Configuration

### Time Windows

Default: 30 minutes before and after event times. Modify in database or when creating events.

### Location Radius

Default: 50 meters. Modify per-event in the database.

### Admin Credentials

Change in `.env.local` or directly in [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)

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

## License

MIT

## Support

For issues or questions, contact Penn Claude Builders Club.
