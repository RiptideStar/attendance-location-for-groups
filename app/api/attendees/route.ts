import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/attendees - Get attendees with filtering
// Query params:
//   - event_id: Filter by specific event
//   - search: Search by name or email (case-insensitive)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const eventId = searchParams.get("event_id");
    const searchTerm = searchParams.get("search");

    // Build query
    let query = (supabaseAdmin as any)
      .from("attendees")
      .select(
        `
        *,
        events:event_id (
          title,
          start_time,
          location_address
        )
      `
      )
      .order("check_in_time", { ascending: false });

    // Filter by event if provided
    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    // Search by name or email if provided
    if (searchTerm && searchTerm.trim()) {
      // Use OR condition to search in both name and email
      query = query.or(
        `name.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%`
      );
    }

    const { data: attendees, error } = await query;

    if (error) {
      console.error("Error fetching attendees:", error);
      return NextResponse.json(
        { error: "Failed to fetch attendees" },
        { status: 500 }
      );
    }

    // Transform data to flatten event details
    const transformedAttendees = attendees.map((attendee: any) => ({
      id: attendee.id,
      event_id: attendee.event_id,
      name: attendee.name,
      email: attendee.email,
      check_in_time: attendee.check_in_time,
      check_in_lat: attendee.check_in_lat,
      check_in_lng: attendee.check_in_lng,
      user_agent: attendee.user_agent,
      created_at: attendee.created_at,
      event_title: attendee.events?.title || "Unknown Event",
      event_start_time: attendee.events?.start_time || null,
      event_location: attendee.events?.location_address || "Unknown Location",
    }));

    return NextResponse.json(transformedAttendees);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
