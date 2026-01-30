import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { RegistrationResponse } from "@/types/organization";

export async function POST(
  request: NextRequest
): Promise<NextResponse<RegistrationResponse>> {
  try {
    const body = await request.json();
    const { username, name, password } = body;

    // Validate required fields
    if (!username || !name || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate username format (lowercase alphanumeric, hyphens, underscores, 3-30 chars)
    const usernameRegex = /^[a-z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username must be 3-30 characters and contain only lowercase letters, numbers, hyphens, and underscores",
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.trim().length < 3 || name.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization name must be between 3 and 100 characters",
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingOrg } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("username", username.toLowerCase().trim())
      .single();

    if (existingOrg) {
      return NextResponse.json(
        {
          success: false,
          error: "Username already taken",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create organization
    const { data: organization, error: insertError } = await (
      supabaseAdmin as any
    )
      .from("organizations")
      .insert({
        username: username.toLowerCase().trim(),
        name: name.trim(),
        password_hash: passwordHash,
      })
      .select("id, username, name")
      .single();

    if (insertError || !organization) {
      console.error("Error creating organization:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create organization",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Organization created successfully",
        organization: {
          id: organization.id,
          username: organization.username,
          name: organization.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error during registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
