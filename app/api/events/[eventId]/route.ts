import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EventUpdate } from "@/types/event";

// GET /api/events/[eventId] - Get a single event
// Public: returns event details by ID (used by the public check-in page).
// Authenticated: scopes the query to the session's organization.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession(authOptions);

    let query = supabaseAdmin.from("events").select("*").eq("id", eventId);

    if (session?.user?.organizationId) {
      query = query.eq("organization_id", session.user.organizationId);
    }

    const { data: event, error } = await query.single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[eventId] - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();

    // Build update object with only provided fields
    const updateData: EventUpdate = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.location_address !== undefined)
      updateData.location_address = body.location_address;
    if (body.location_lat !== undefined) {
      if (body.location_lat < -90 || body.location_lat > 90) {
        return NextResponse.json(
          { error: "Invalid latitude value" },
          { status: 400 }
        );
      }
      updateData.location_lat = body.location_lat;
    }
    if (body.location_lng !== undefined) {
      if (body.location_lng < -180 || body.location_lng > 180) {
        return NextResponse.json(
          { error: "Invalid longitude value" },
          { status: 400 }
        );
      }
      updateData.location_lng = body.location_lng;
    }
    if (body.registration_window_before_minutes !== undefined)
      updateData.registration_window_before_minutes =
        body.registration_window_before_minutes;
    if (body.registration_window_after_minutes !== undefined)
      updateData.registration_window_after_minutes =
        body.registration_window_after_minutes;
    if (body.location_radius_meters !== undefined)
      updateData.location_radius_meters = body.location_radius_meters;
    if (body.is_closed !== undefined) updateData.is_closed = body.is_closed;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;

    // Validate time range if both times are being updated
    if (updateData.start_time && updateData.end_time) {
      const startDate = new Date(updateData.start_time);
      const endDate = new Date(updateData.end_time);

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .eq("organization_id", session.user.organizationId)
      .select()
      .single();

    if (error || !event) {
      console.error("Error updating event:", error);
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[eventId] - Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("organization_id", session.user.organizationId);

    if (error) {
      console.error("Error deleting event:", error);
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
