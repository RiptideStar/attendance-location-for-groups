import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";

// PATCH /api/locations/[locationId] - Update a saved location (toggle favorite, rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.is_favorite !== undefined) updateData.is_favorite = body.is_favorite;
    if (body.label !== undefined) updateData.label = body.label;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: location, error } = await (supabaseAdmin as any)
      .from("organization_locations")
      .update(updateData)
      .eq("id", locationId)
      .eq("organization_id", session.user.organizationId)
      .select()
      .single();

    if (error || !location) {
      console.error("Error updating location:", error);
      return NextResponse.json(
        { error: "Failed to update location" },
        { status: 500 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[locationId] - Remove a saved location
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { locationId } = await params;

    const { error } = await (supabaseAdmin as any)
      .from("organization_locations")
      .delete()
      .eq("id", locationId)
      .eq("organization_id", session.user.organizationId);

    if (error) {
      console.error("Error deleting location:", error);
      return NextResponse.json(
        { error: "Failed to delete location" },
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
