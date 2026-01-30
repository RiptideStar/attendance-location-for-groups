import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";

// POST /api/events/[eventId]/close - Manually close event registration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .update({ is_closed: true })
      .eq("id", eventId)
      .eq("organization_id", session.user.organizationId)
      .select()
      .single();

    if (error || !event) {
      console.error("Error closing event:", error);
      return NextResponse.json(
        { error: "Failed to close event" },
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

// DELETE /api/events/[eventId]/close - Reopen event registration
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

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .update({ is_closed: false })
      .eq("id", eventId)
      .eq("organization_id", session.user.organizationId)
      .select()
      .single();

    if (error || !event) {
      console.error("Error reopening event:", error);
      return NextResponse.json(
        { error: "Failed to reopen event" },
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
