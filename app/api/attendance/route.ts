import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isWithinRadius, isValidCoordinates } from "@/lib/geolocation/verification";
import { isWithinEventWindow } from "@/lib/utils/date-helpers";
import {
  hasAttendedServer,
  createAttendanceCookie,
} from "@/lib/cookies/attendance-cookie";
import type { CheckInSubmission, CheckInResponse } from "@/types/attendance";

// POST /api/attendance - Submit attendance check-in
export async function POST(request: NextRequest): Promise<NextResponse<CheckInResponse>> {
  try {
    const body: CheckInSubmission = await request.json();
    const { eventId, name, email, lat, lng } = body;

    // 1. Validate input
    if (!eventId || !name || !email || lat === undefined || lng === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          code: "validation_error",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
          code: "validation_error",
        },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (!isValidCoordinates({ lat, lng })) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coordinates",
          code: "validation_error",
        },
        { status: 400 }
      );
    }

    // 2. Check cookie for duplicate check-in
    const cookieHeader = request.headers.get("cookie");
    if (hasAttendedServer(eventId, cookieHeader)) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already checked in to this event",
          code: "duplicate",
        },
        { status: 400 }
      );
    }

    // 3. Fetch event from database
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
          code: "event_not_found",
        },
        { status: 404 }
      );
    }

    // 4. Check if event is manually closed
    if (event.is_closed) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration for this event has been closed by admin",
          code: "event_closed",
        },
        { status: 400 }
      );
    }

    // 5. Validate time window
    const withinWindow = isWithinEventWindow(
      event.start_time,
      event.end_time,
      event.registration_window_before_minutes,
      event.registration_window_after_minutes
    );

    if (!withinWindow) {
      const now = new Date();
      const windowStart = new Date(
        new Date(event.start_time).getTime() -
          event.registration_window_before_minutes * 60 * 1000
      );

      if (now < windowStart) {
        return NextResponse.json(
          {
            success: false,
            error: "Registration has not opened yet for this event",
            code: "outside_window",
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Registration has closed for this event",
            code: "outside_window",
          },
          { status: 400 }
        );
      }
    }

    // 6. Validate location (within radius)
    const userCoords = { lat, lng };
    const eventCoords = {
      lat: event.location_lat,
      lng: event.location_lng,
    };

    if (!isWithinRadius(userCoords, eventCoords, event.location_radius_meters)) {
      const distance = require("@/lib/geolocation/verification").calculateDistance(
        userCoords,
        eventCoords
      );

      return NextResponse.json(
        {
          success: false,
          error: `You are too far from the event location. You are ${Math.round(
            distance
          )}m away, but must be within ${event.location_radius_meters}m.`,
          code: "outside_radius",
        },
        { status: 400 }
      );
    }

    // 7. Insert attendance record into database
    const { data: attendee, error: insertError } = await supabaseAdmin
      .from("attendees")
      .insert({
        event_id: eventId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        check_in_lat: lat,
        check_in_lng: lng,
        user_agent: request.headers.get("user-agent") || undefined,
      })
      .select()
      .single();

    if (insertError || !attendee) {
      console.error("Error inserting attendee:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to record attendance",
          code: "server_error",
        },
        { status: 500 }
      );
    }

    // 8. Set cookie to prevent duplicate check-ins
    const cookieValue = createAttendanceCookie(eventId);
    const response = NextResponse.json(
      {
        success: true,
        message: "Successfully checked in!",
        attendee,
      },
      { status: 201 }
    );

    response.headers.set("Set-Cookie", cookieValue);

    return response;
  } catch (error) {
    console.error("Unexpected error in attendance API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "server_error",
      },
      { status: 500 }
    );
  }
}
