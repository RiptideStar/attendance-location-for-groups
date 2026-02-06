import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendBulkEmails, textToHtml, wrapHtmlEmail } from "@/lib/email/resend";
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
      attachments,
      firstTimeOnly,
    } = body;
    const organizationId = session.user.organizationId;

    let earliestStartByEmail: Map<string, number> | null = null;
    if (firstTimeOnly) {
      const { data: allAttendees, error: allError } = await supabaseAdmin
        .from("attendees")
        .select(
          `
          email,
          events!inner (
            start_time
          )
        `
        )
        .eq("organization_id", organizationId);

      if (allError) {
        console.error("Error fetching attendee history:", allError);
        return NextResponse.json(
          { error: "Failed to fetch attendee history" },
          { status: 500 }
        );
      }

      earliestStartByEmail = new Map<string, number>();
      for (const attendee of allAttendees || []) {
        const email = String(attendee.email).toLowerCase();
        const event = attendee.events as unknown as { start_time: string };
        const startMs = new Date(event.start_time).getTime();
        const existing = earliestStartByEmail.get(email);
        if (existing === undefined || startMs < existing) {
          earliestStartByEmail.set(email, startMs);
        }
      }
    }

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
        check_in_time,
        check_in_lat,
        check_in_lng,
        user_agent,
        events!inner (
          id,
          title,
          start_time,
          end_time,
          location_address,
          location_lat,
          location_lng,
          registration_window_before_minutes,
          registration_window_after_minutes,
          location_radius_meters,
          is_closed,
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
        check_in_time: string | null;
        check_in_lat: number;
        check_in_lng: number;
        user_agent: string | null;
        eventStartMs: number;
        event: {
          id: string;
          title: string;
          start_time: string;
          end_time: string;
          location_address: string;
          location_lat: number;
          location_lng: number;
          registration_window_before_minutes: number | null;
          registration_window_after_minutes: number | null;
          location_radius_meters: number | null;
          is_closed: boolean | null;
          timezone: string | null;
        } | null;
      }
    >();
    for (const attendee of attendees || []) {
      const emailKey = String(attendee.email).toLowerCase();
      const eventStartMs = new Date(
        (attendee.events as unknown as { start_time: string }).start_time
      ).getTime();
      const existing = emailMap.get(emailKey);
      if (!existing || eventStartMs < existing.eventStartMs) {
        const event = attendee.events as unknown as {
          id: string;
          title: string;
          start_time: string;
          end_time: string;
          location_address: string;
          location_lat: number;
          location_lng: number;
          registration_window_before_minutes: number | null;
          registration_window_after_minutes: number | null;
          location_radius_meters: number | null;
          is_closed: boolean | null;
          timezone: string | null;
        };
        emailMap.set(emailKey, {
          email: attendee.email,
          name: attendee.name,
          check_in_time: attendee.check_in_time,
          check_in_lat: attendee.check_in_lat,
          check_in_lng: attendee.check_in_lng,
          user_agent: attendee.user_agent ?? null,
          eventStartMs,
          event,
        });
      }
    }

    let recipients = Array.from(emailMap.values());
    if (firstTimeOnly && earliestStartByEmail) {
      recipients = recipients.filter((recipient) => {
        const earliest = earliestStartByEmail!.get(recipient.email.toLowerCase());
        return earliest !== undefined && earliest === recipient.eventStartMs;
      });
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

      // Always send as HTML with clickable links
      const htmlContent = wrapHtmlEmail(textToHtml(substitutedBody));

      return {
        to: recipient.email,
        name: recipient.name,
        subject: substitutedSubject,
        html: htmlContent,
      };
    });

    // Send emails
    const results = await sendBulkEmails(emails, {
      smtp: smtpConfig,
      attachments,
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

    if (failureCount > 0) {
      const failedEmailSet = new Set(
        results
          .filter((r) => !r.success)
          .map((r) => r.email.toLowerCase())
      );
      const failedRecipients = recipients.filter((recipient) =>
        failedEmailSet.has(recipient.email.toLowerCase())
      );

      const failedByEvent = new Map<
        string,
        {
          event: NonNullable<typeof failedRecipients[number]["event"]>;
          attendees: typeof failedRecipients;
        }
      >();

      for (const recipient of failedRecipients) {
        if (!recipient.event) continue;
        const eventId = recipient.event.id;
        if (!failedByEvent.has(eventId)) {
          failedByEvent.set(eventId, {
            event: recipient.event,
            attendees: [],
          });
        }
        failedByEvent.get(eventId)!.attendees.push(recipient);
      }

      for (const { event, attendees } of failedByEvent.values()) {
        const newEventTitle = `Failed Email Send - ${event.title}`;
        const { data: newEvent, error: newEventError } = await supabaseAdmin
          .from("events")
          .insert({
            title: newEventTitle,
            start_time: event.start_time,
            end_time: event.end_time,
            location_address: event.location_address,
            location_lat: event.location_lat,
            location_lng: event.location_lng,
            registration_window_before_minutes:
              event.registration_window_before_minutes ?? 30,
            registration_window_after_minutes:
              event.registration_window_after_minutes ?? 30,
            location_radius_meters: event.location_radius_meters ?? 50,
            is_closed: true,
            timezone: event.timezone || "America/New_York",
            organization_id: organizationId,
          })
          .select("id")
          .single();

        if (newEventError || !newEvent) {
          console.error("Failed to create failed-email event:", newEventError);
          continue;
        }

        const attendeeRows = attendees.map((attendee) => ({
          event_id: newEvent.id,
          organization_id: organizationId,
          name: attendee.name,
          email: attendee.email,
          check_in_time: attendee.check_in_time,
          check_in_lat: attendee.check_in_lat,
          check_in_lng: attendee.check_in_lng,
          user_agent: attendee.user_agent ?? null,
        }));

        const { error: attendeeInsertError } = await supabaseAdmin
          .from("attendees")
          .insert(attendeeRows);

        if (attendeeInsertError) {
          console.error(
            "Failed to insert failed-email attendees:",
            attendeeInsertError
          );
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
