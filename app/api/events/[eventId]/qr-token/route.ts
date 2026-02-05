import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createQrToken, getQrTokenTtlMs } from "@/lib/security/qr-tokens";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    if (!eventId) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 });
    }

    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select("id, organization_id")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organization_id !== session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const issuedAtMs = Date.now();
    const token = createQrToken(eventId, issuedAtMs);
    const expiresAt = issuedAtMs + getQrTokenTtlMs();

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error("Error generating QR token:", error);
    return NextResponse.json(
      { error: "Failed to generate QR token" },
      { status: 500 }
    );
  }
}
