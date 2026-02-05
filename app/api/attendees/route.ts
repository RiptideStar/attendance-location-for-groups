import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/attendees - Get attendees with filtering
// Query params:
//   - event_id: Filter by specific event
//   - search: Search by name or email (case-insensitive)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const eventId = searchParams.get("event_id");
    const searchTerm = searchParams.get("search");

    // Build query with organization filter
    // Note: Avoid selecting events.timezone to remain compatible with databases
    // that haven't applied the timezone migration yet. The client will fall back
    // to browser timezone when event timezone is unavailable.
    let query = supabaseAdmin
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
      .eq("organization_id", session.user.organizationId)
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
    const transformedAttendees = attendees.map((attendee) => ({
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
      event_timezone: null as string | null,
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

// POST /api/attendees - Manually add an attendee (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event_id, name, email } = body;

    // Validate required fields
    if (!event_id || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: event_id, name, email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify the event belongs to this organization
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, organization_id, location_lat, location_lng")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (event.organization_id !== session.user.organizationId) {
      return NextResponse.json(
        { error: "Event does not belong to your organization" },
        { status: 403 }
      );
    }

    // Insert the attendee with event's location as check-in location (manual add)
    const { data: attendee, error: insertError } = await supabaseAdmin
      .from("attendees")
      .insert({
        event_id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        check_in_lat: event.location_lat,
        check_in_lng: event.location_lng,
        user_agent: "Manual entry by admin",
        organization_id: session.user.organizationId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting attendee:", insertError);
      return NextResponse.json(
        { error: "Failed to add attendee" },
        { status: 500 }
      );
    }

    return NextResponse.json(attendee, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/attendees - Mass delete attendees (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: ids (array of attendee IDs)" },
        { status: 400 }
      );
    }

    // Delete attendees that belong to this organization
    const { error: deleteError, count } = await supabaseAdmin
      .from("attendees")
      .delete({ count: "exact" })
      .in("id", ids)
      .eq("organization_id", session.user.organizationId);

    if (deleteError) {
      console.error("Error deleting attendees:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete attendees" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: count,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
