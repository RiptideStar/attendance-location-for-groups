import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EmailBlastPreview } from "@/types/email";

// POST /api/email-blast/preview - Get recipient preview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventIds, dateFrom, dateTo } = await request.json();
    const organizationId = session.user.organizationId;

    // Build query for attendees with event details
    let query = supabaseAdmin
      .from("attendees")
      .select(
        `
        email,
        name,
        event_id,
        events!inner (
          id,
          title,
          start_time
        )
      `
      )
      .eq("organization_id", organizationId);

    // Filter by specific events if provided
    if (eventIds && eventIds.length > 0) {
      query = query.in("event_id", eventIds);
    }

    // Filter by date range if provided
    if (dateFrom) {
      query = query.gte("events.start_time", dateFrom);
    }
    if (dateTo) {
      // Add time to include the full day
      query = query.lte("events.start_time", `${dateTo}T23:59:59`);
    }

    const { data: attendees, error } = await query;

    if (error) {
      console.error("Error fetching attendees:", error);
      return NextResponse.json(
        { error: "Failed to fetch attendees" },
        { status: 500 }
      );
    }

    // Deduplicate by email (keep first occurrence)
    const emailMap = new Map<string, { email: string; name: string }>();
    const eventSet = new Set<string>();
    const eventTitles: string[] = [];

    for (const attendee of attendees || []) {
      if (!emailMap.has(attendee.email)) {
        emailMap.set(attendee.email, {
          email: attendee.email,
          name: attendee.name,
        });
      }

      const event = attendee.events as unknown as {
        id: string;
        title: string;
        start_time: string;
      };
      if (event && !eventSet.has(event.id)) {
        eventSet.add(event.id);
        eventTitles.push(event.title);
      }
    }

    const recipients = Array.from(emailMap.values());

    const preview: EmailBlastPreview = {
      recipientCount: recipients.length,
      recipients: recipients.slice(0, 10), // First 10 for preview
      totalEvents: eventSet.size,
      eventTitles: eventTitles.slice(0, 5), // First 5 event titles
    };

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
