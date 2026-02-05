import { Resend } from "resend";
import nodemailer from "nodemailer";

// Provider selection
const resendApiKey = process.env.RESEND_API_KEY;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure =
  process.env.SMTP_SECURE?.toLowerCase() === "false" ? false : true;

const shouldUseSmtp = Boolean(smtpUser && smtpPass);

// Initialize Resend client (fallback when SMTP not configured)
if (!resendApiKey && !shouldUseSmtp) {
  console.warn(
    "Email not configured - set SMTP_USER/SMTP_PASS or RESEND_API_KEY"
  );
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

const envSmtpConfig: SmtpConfig | null = shouldUseSmtp
  ? {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser!,
      pass: smtpPass!,
      fromEmail: process.env.SMTP_FROM_EMAIL,
    }
  : null;

export const FROM_EMAIL =
  (shouldUseSmtp ? process.env.SMTP_FROM_EMAIL : undefined) ||
  process.env.RESEND_FROM_EMAIL ||
  "onboarding@resend.dev";

// Rate limiting constants
export const RESEND_FREE_TIER_DAILY_LIMIT = 100;
export const RESEND_FREE_TIER_MONTHLY_LIMIT = 3000;

/**
 * Convert plain text to HTML with clickable links
 * - Converts URLs to <a> tags
 * - Converts newlines to <br> tags
 * - Escapes HTML entities
 */
export function textToHtml(text: string): string {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Convert markdown-style links to anchors: [text](https://example.com)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  html = html.replace(
    markdownLinkRegex,
    '<a href="$2" style="color: #4f46e5;">$1</a>'
  );

  // Convert bare URLs to clickable links (skip inside existing anchors)
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const anchorRegex = /<a [^>]+>.*?<\/a>/gi;
  let linkedHtml = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    linkedHtml += before.replace(
      urlRegex,
      '<a href="$1" style="color: #4f46e5;">$1</a>'
    );
    linkedHtml += match[0];
    lastIndex = match.index + match[0].length;
  }

  linkedHtml += html.slice(lastIndex).replace(
    urlRegex,
    '<a href="$1" style="color: #4f46e5;">$1</a>'
  );
  html = linkedHtml;

  // Convert newlines to <br> tags
  html = html.replace(/\n/g, "<br>");

  return html;
}

/**
 * Wrap content in proper email HTML document structure
 */
export function wrapHtmlEmail(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
${content}
</body>
</html>`;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  smtp?: SmtpConfig;
  smtpTransport?: nodemailer.Transporter;
  attachments?: EmailAttachment[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
}

function buildFromAddress(config?: SmtpConfig, explicitFrom?: string) {
  if (explicitFrom) {
    return explicitFrom;
  }
  if (config?.fromEmail) {
    return config.fromName
      ? `${config.fromName} <${config.fromEmail}>`
      : config.fromEmail;
  }
  return FROM_EMAIL;
}

function createSmtpTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    // Reuse a single connection to reduce auth attempts against SMTP providers.
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 8,
  });
}

export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Providers require at least one of html or text
    if (!params.html && !params.text) {
      return { success: false, error: "Either html or text content is required" };
    }

    const smtpConfig = params.smtp ?? envSmtpConfig ?? undefined;
    const smtpTransport =
      params.smtpTransport || (smtpConfig ? createSmtpTransport(smtpConfig) : null);
    const from = buildFromAddress(smtpConfig, params.from);
    const replyTo = params.replyTo || smtpConfig?.replyTo;

    // Convert attachments to nodemailer format
    const nodemailerAttachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
      contentType: att.contentType,
    }));

    // Convert attachments to Resend format
    const resendAttachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
    }));

    if (smtpTransport) {
      const info = await smtpTransport.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        ...(replyTo ? { replyTo } : {}),
        ...(params.html ? { html: params.html } : { text: params.text! }),
        ...(nodemailerAttachments?.length ? { attachments: nodemailerAttachments } : {}),
      });
      return { success: true, messageId: info.messageId };
    }

    if (!resend) {
      return { success: false, error: "Email service not configured" };
    }

    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      ...(replyTo ? { replyTo } : {}),
      ...(params.html ? { html: params.html } : { text: params.text! }),
      ...(resendAttachments?.length ? { attachments: resendAttachments } : {}),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// Send multiple emails with basic rate limiting
export async function sendBulkEmails(
  emails: Array<{
    to: string;
    name: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }>,
  options?: {
    smtp?: SmtpConfig;
    from?: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
  }
): Promise<Array<{ email: string; success: boolean; error?: string }>> {
  const results: Array<{ email: string; success: boolean; error?: string }> =
    [];
  const smtpConfig = options?.smtp ?? envSmtpConfig ?? undefined;
  const smtpTransport = smtpConfig ? createSmtpTransport(smtpConfig) : undefined;
  const authThrottleRegex = /too many login attempts|invalid login|454-4\.7\.0/i;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    // Basic rate limiting: 10 emails per second max
    if (i > 0 && i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const result = await sendEmail({
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: email.from ?? options?.from,
      replyTo: email.replyTo ?? options?.replyTo,
      smtp: smtpConfig,
      smtpTransport,
      attachments: options?.attachments,
    });

    results.push({
      email: email.to,
      success: result.success,
      error: result.error,
    });

    if (!result.success && result.error && authThrottleRegex.test(result.error)) {
      const remaining = emails.slice(i + 1);
      for (const pending of remaining) {
        results.push({
          email: pending.to,
          success: false,
          error: "Skipped due to SMTP auth throttling",
        });
      }
      break;
    }
  }

  return results;
}
