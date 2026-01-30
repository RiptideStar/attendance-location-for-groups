import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { RecurringEventInsert } from "@/types/recurring-event";
import {
  generateEventInstances,
  validateRecurringEvent,
} from "@/lib/utils/recurring-events";
import { upsertOrganizationLocation } from "@/lib/locations/save-location";

// GET /api/recurring-events - Get all recurring events for authenticated organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: recurringEvents, error } = await (supabaseAdmin as any)
      .from("recurring_events")
      .select(
        `
        *,
        events:events(count)
      `
      )
      .eq("organization_id", session.user.organizationId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching recurring events:", error);
      return NextResponse.json(
        { error: "Failed to fetch recurring events" },
        { status: 500 }
      );
    }

    // Transform the data to include event count
    // Supabase's (count) aggregate returns [{ count: N }], so read the value directly
    const recurringEventsWithCount = recurringEvents.map((re: any) => ({
      ...re,
      event_count:
        Array.isArray(re.events) && re.events.length > 0
          ? re.events[0].count
          : 0,
    }));

    return NextResponse.json(recurringEventsWithCount);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/recurring-events - Create a new recurring event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Prepare recurring event data
    const recurringEventData: RecurringEventInsert = {
      title: body.title,
      location_address: body.location_address,
      location_lat: body.location_lat,
      location_lng: body.location_lng,
      start_time: body.start_time,
      duration_minutes: body.duration_minutes,
      recurrence_type: body.recurrence_type,
      recurrence_interval: body.recurrence_interval || 1,
      recurrence_days: body.recurrence_days || null,
      recurrence_monthly_date: body.recurrence_monthly_date || null,
      recurrence_monthly_week: body.recurrence_monthly_week || null,
      recurrence_monthly_weekday: body.recurrence_monthly_weekday || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      registration_window_before_minutes:
        body.registration_window_before_minutes || 30,
      registration_window_after_minutes:
        body.registration_window_after_minutes || 30,
      location_radius_meters: body.location_radius_meters || 50,
      organization_id: session.user.organizationId,
    };

    // Validate the recurring event
    const validation = validateRecurringEvent(recurringEventData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Create the recurring event
    const { data: recurringEvent, error: recurringError } = await (
      supabaseAdmin as any
    )
      .from("recurring_events")
      .insert(recurringEventData)
      .select()
      .single();

    if (recurringError) {
      console.error("Error creating recurring event:", recurringError);
      return NextResponse.json(
        { error: "Failed to create recurring event" },
        { status: 500 }
      );
    }

    // Generate event instances
    const eventInstances = generateEventInstances(recurringEvent);

    if (eventInstances.length === 0) {
      return NextResponse.json(
        {
          error: "No event instances could be generated from this pattern",
        },
        { status: 400 }
      );
    }

    // Insert all event instances
    const { data: events, error: eventsError } = await (supabaseAdmin as any)
      .from("events")
      .insert(eventInstances)
      .select();

    if (eventsError) {
      console.error("Error creating event instances:", eventsError);
      // Rollback: delete the recurring event
      await (supabaseAdmin as any)
        .from("recurring_events")
        .delete()
        .eq("id", recurringEvent.id);

      return NextResponse.json(
        { error: "Failed to create event instances" },
        { status: 500 }
      );
    }

    // Auto-save location for future reuse (fire-and-forget)
    upsertOrganizationLocation(
      session.user.organizationId,
      body.location_address,
      body.location_lat,
      body.location_lng
    );

    return NextResponse.json(
      {
        recurring_event: recurringEvent,
        events_created: events.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
