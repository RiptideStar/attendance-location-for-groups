import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EmailTemplateInsert } from "@/types/email-template";

// GET /api/email-templates - List all templates for organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get templates with send count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: templates, error } = await (supabaseAdmin as any)
      .from("email_templates")
      .select(
        `
        *,
        email_sends (count)
      `
      )
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    // Transform to include total_sent count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templatesWithStats = (templates || []).map((t: any) => ({
      ...t,
      total_sent: Array.isArray(t.email_sends)
        ? t.email_sends.length
        : t.email_sends?.count || 0,
      email_sends: undefined,
    }));

    return NextResponse.json(templatesWithStats);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/email-templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EmailTemplateInsert = await request.json();
    const { name, subject, body: templateBody, is_html } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }
    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }
    if (!templateBody?.trim()) {
      return NextResponse.json(
        { error: "Email body is required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template, error } = await (supabaseAdmin as any)
      .from("email_templates")
      .insert({
        organization_id: session.user.organizationId,
        name: name.trim(),
        subject: subject.trim(),
        body: templateBody.trim(),
        is_html: is_html || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
