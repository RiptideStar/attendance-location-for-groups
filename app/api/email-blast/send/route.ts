import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  sendBulkEmails,
  RESEND_FREE_TIER_DAILY_LIMIT,
} from "@/lib/email/resend";
import { decryptSmtpPassword } from "@/lib/email/smtp-crypto";
import { substituteVariables } from "@/lib/email/template-variables";
import type { EmailBlastRequest, EmailBlastResponse } from "@/types/email";

// POST /api/email-blast/send - Send email blast
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EmailBlastRequest = await request.json();
    const {
      eventIds,
      dateFrom,
      dateTo,
      subject,
      body: emailBody,
      isHtml,
    } = body;
    const organizationId = session.user.organizationId;

    const { data: organization, error: organizationError } = await supabaseAdmin
      .from("organizations")
      .select(
        "smtp_host,smtp_port,smtp_user,smtp_pass,smtp_pass_iv,smtp_pass_tag,smtp_secure,smtp_from_email,smtp_from_name,smtp_reply_to"
      )
      .eq("id", organizationId)
      .single();

    if (organizationError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const hasEncryptedPass =
      Boolean(organization.smtp_pass) &&
      Boolean(organization.smtp_pass_iv) &&
      Boolean(organization.smtp_pass_tag);

    const smtpConfigured =
      Boolean(organization.smtp_host) &&
      Boolean(organization.smtp_user) &&
      Boolean(organization.smtp_pass) &&
      (hasEncryptedPass || !organization.smtp_pass_iv);

    if (!smtpConfigured) {
      return NextResponse.json(
        { error: "Organization SMTP settings are not configured" },
        { status: 400 }
      );
    }

    if (!organization.smtp_from_email) {
      return NextResponse.json(
        { error: "Organization SMTP 'from' email is not configured" },
        { status: 400 }
      );
    }

    let smtpPass = organization.smtp_pass as string;
    if (hasEncryptedPass) {
      try {
        smtpPass = decryptSmtpPassword({
          ciphertext: organization.smtp_pass as string,
          iv: organization.smtp_pass_iv as string,
          tag: organization.smtp_pass_tag as string,
        });
      } catch (err) {
        console.error("Failed to decrypt SMTP password:", err);
        return NextResponse.json(
          { error: "SMTP encryption key is invalid or missing" },
          { status: 500 }
        );
      }
    }

    const smtpConfig = {
      host: organization.smtp_host as string,
      port: Number(organization.smtp_port || 465),
      secure:
        organization.smtp_secure === null || organization.smtp_secure === undefined
          ? true
          : Boolean(organization.smtp_secure),
      user: organization.smtp_user as string,
      pass: smtpPass,
      fromEmail: organization.smtp_from_email as string,
      fromName: organization.smtp_from_name as string | undefined,
      replyTo: organization.smtp_reply_to as string | undefined,
    };

    // Validate required fields
    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }
    if (!emailBody?.trim()) {
      return NextResponse.json(
        { error: "Email body is required" },
        { status: 400 }
      );
    }

    // Build query for attendees
    let query = supabaseAdmin
      .from("attendees")
      .select(
        `
        email,
        name,
        events!inner (
          id,
          title,
          start_time,
          timezone
        )
      `
      )
      .eq("organization_id", organizationId);

    if (eventIds && eventIds.length > 0) {
      query = query.in("event_id", eventIds);
    }

    if (dateFrom) {
      query = query.gte("events.start_time", dateFrom);
    }
    if (dateTo) {
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

    // Deduplicate by email, keeping event info for variable substitution
    const emailMap = new Map<
      string,
      {
        email: string;
        name: string;
        event: { id: string; title: string; start_time: string; timezone: string | null } | null;
      }
    >();
    for (const attendee of attendees || []) {
      if (!emailMap.has(attendee.email)) {
        const event = attendee.events as unknown as {
          id: string;
          title: string;
          start_time: string;
          timezone: string | null;
        };
        emailMap.set(attendee.email, {
          email: attendee.email,
          name: attendee.name,
          event,
        });
      }
    }

    const recipients = Array.from(emailMap.values());

    // Check rate limit
    if (recipients.length > RESEND_FREE_TIER_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Too many recipients (${recipients.length}). Free tier limit is ${RESEND_FREE_TIER_DAILY_LIMIT} emails/day. Consider upgrading your Resend plan or sending in batches.`,
        },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found for the selected criteria" },
        { status: 400 }
      );
    }

    // Prepare emails with variable substitution
    const emails = recipients.map((recipient) => {
      const context = {
        attendee: { name: recipient.name, email: recipient.email },
        event: recipient.event
          ? {
              title: recipient.event.title,
              start_time: recipient.event.start_time,
              timezone: recipient.event.timezone || undefined,
            }
          : null,
      };

      const substitutedSubject = substituteVariables(subject, context);
      const substitutedBody = substituteVariables(emailBody, context);

      return {
        to: recipient.email,
        name: recipient.name,
        subject: substitutedSubject,
        ...(isHtml ? { html: substitutedBody } : { text: substitutedBody }),
      };
    });

    // Send emails
    const results = await sendBulkEmails(emails, {
      smtp: smtpConfig,
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const errors = results
      .filter((r) => !r.success)
      .map((r) => ({ email: r.email, error: r.error || "Unknown error" }));

    const response: EmailBlastResponse = {
      success: failureCount === 0,
      message:
        failureCount === 0
          ? `Successfully sent ${successCount} emails`
          : `Sent ${successCount} emails, ${failureCount} failed`,
      totalSent: successCount,
      totalFailed: failureCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
