import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EventInsert } from "@/types/event";

// GET /api/events - Get all events
export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        *,
        attendees:attendees(count)
      `
      )
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Transform the data to include attendee count
    const eventsWithCount = events.map((event) => ({
      ...event,
      attendee_count: Array.isArray(event.attendees)
        ? event.attendees.length
        : 0,
    }));

    return NextResponse.json(eventsWithCount);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      title,
      start_time,
      end_time,
      location_address,
      location_lat,
      location_lng,
    } = body;

    if (
      !title ||
      !start_time ||
      !end_time ||
      !location_address ||
      location_lat === undefined ||
      location_lng === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate lat/lng ranges
    if (location_lat < -90 || location_lat > 90) {
      return NextResponse.json(
        { error: "Invalid latitude value" },
        { status: 400 }
      );
    }

    if (location_lng < -180 || location_lng > 180) {
      return NextResponse.json(
        { error: "Invalid longitude value" },
        { status: 400 }
      );
    }

    // Validate time range
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Create event data
    const eventData: EventInsert = {
      title,
      start_time,
      end_time,
      location_address,
      location_lat,
      location_lng,
      registration_window_before_minutes:
        body.registration_window_before_minutes || 30,
      registration_window_after_minutes:
        body.registration_window_after_minutes || 30,
      location_radius_meters: body.location_radius_meters || 50,
    };

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
