import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";

// GET /api/locations - Get saved locations for the authenticated organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: locations, error } = await (supabaseAdmin as any)
      .from("organization_locations")
      .select(
        "id, label, address, lat, lng, is_favorite, last_used_at, use_count"
      )
      .eq("organization_id", session.user.organizationId)
      .order("is_favorite", { ascending: false })
      .order("last_used_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching locations:", error);
      return NextResponse.json(
        { error: "Failed to fetch locations" },
        { status: 500 }
      );
    }

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
