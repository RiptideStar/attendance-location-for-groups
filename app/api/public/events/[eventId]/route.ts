import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/public/events/[eventId] - Get event details for public check-in
// This endpoint is unauthenticated and returns only the fields needed for check-in
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        id,
        title,
        start_time,
        end_time,
        timezone,
        location_address,
        location_lat,
        location_lng,
        location_radius_meters,
        registration_window_before_minutes,
        registration_window_after_minutes,
        is_closed
      `
      )
      .eq("id", eventId)
      .single();

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
