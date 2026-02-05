import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import { encryptSmtpPassword } from "@/lib/email/smtp-crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: organization, error } = await supabaseAdmin
    .from("organizations")
    .select(
      "smtp_host,smtp_port,smtp_user,smtp_secure,smtp_from_email,smtp_from_name,smtp_reply_to,smtp_pass"
    )
    .eq("id", session.user.organizationId)
    .single();

  if (error || !organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    smtp_host: organization.smtp_host,
    smtp_port: organization.smtp_port,
    smtp_user: organization.smtp_user,
    smtp_secure: organization.smtp_secure,
    smtp_from_email: organization.smtp_from_email,
    smtp_from_name: organization.smtp_from_name,
    smtp_reply_to: organization.smtp_reply_to,
    hasPassword: Boolean(organization.smtp_pass),
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_pass,
    smtp_secure,
    smtp_from_email,
    smtp_from_name,
    smtp_reply_to,
  } = body || {};

  if (!smtp_host || !smtp_user || !smtp_from_email) {
    return NextResponse.json(
      { error: "SMTP host, user, and from email are required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    smtp_host: String(smtp_host).trim(),
    smtp_user: String(smtp_user).trim(),
    smtp_from_email: String(smtp_from_email).trim(),
    smtp_from_name: smtp_from_name ? String(smtp_from_name).trim() : null,
    smtp_reply_to: smtp_reply_to ? String(smtp_reply_to).trim() : null,
    smtp_secure:
      smtp_secure === null || smtp_secure === undefined
        ? true
        : Boolean(smtp_secure),
  };

  if (smtp_port !== undefined && smtp_port !== null && smtp_port !== "") {
    updates.smtp_port = Number(smtp_port);
  }

  if (typeof smtp_pass === "string") {
    if (smtp_pass.trim().length === 0) {
      updates.smtp_pass = null;
      updates.smtp_pass_iv = null;
      updates.smtp_pass_tag = null;
    } else {
      try {
        const encrypted = encryptSmtpPassword(smtp_pass);
        updates.smtp_pass = encrypted.ciphertext;
        updates.smtp_pass_iv = encrypted.iv;
        updates.smtp_pass_tag = encrypted.tag;
      } catch (err) {
        console.error("Failed to encrypt SMTP password:", err);
        return NextResponse.json(
          { error: "SMTP encryption key is invalid or missing" },
          { status: 500 }
        );
      }
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from("organizations")
    .update(updates)
    .eq("id", session.user.organizationId)
    .select(
      "smtp_host,smtp_port,smtp_user,smtp_secure,smtp_from_email,smtp_from_name,smtp_reply_to,smtp_pass"
    )
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Failed to update SMTP settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    smtp_host: updated.smtp_host,
    smtp_port: updated.smtp_port,
    smtp_user: updated.smtp_user,
    smtp_secure: updated.smtp_secure,
    smtp_from_email: updated.smtp_from_email,
    smtp_from_name: updated.smtp_from_name,
    smtp_reply_to: updated.smtp_reply_to,
    hasPassword: Boolean(updated.smtp_pass),
  });
}
