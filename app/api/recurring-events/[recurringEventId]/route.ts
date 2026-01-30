import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/recurring-events/[recurringEventId] - Get a specific recurring event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recurringEventId: string }> }
) {
  try {
    const { recurringEventId } = await params;

    const { data: recurringEvent, error } = await (supabaseAdmin as any)
      .from("recurring_events")
      .select("*")
      .eq("id", recurringEventId)
      .single();

    if (error) {
      console.error("Error fetching recurring event:", error);
      return NextResponse.json(
        { error: "Recurring event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(recurringEvent);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/recurring-events/[recurringEventId] - Delete a recurring event and its instances
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recurringEventId: string }> }
) {
  try {
    const { recurringEventId } = await params;

    // First, delete all associated events
    const { error: eventsError } = await (supabaseAdmin as any)
      .from("events")
      .delete()
      .eq("recurring_event_id", recurringEventId);

    if (eventsError) {
      console.error("Error deleting event instances:", eventsError);
      return NextResponse.json(
        { error: "Failed to delete event instances" },
        { status: 500 }
      );
    }

    // Then delete the recurring event
    const { error: recurringError } = await (supabaseAdmin as any)
      .from("recurring_events")
      .delete()
      .eq("id", recurringEventId);

    if (recurringError) {
      console.error("Error deleting recurring event:", recurringError);
      return NextResponse.json(
        { error: "Failed to delete recurring event" },
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
