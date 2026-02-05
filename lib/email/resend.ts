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

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  smtp?: SmtpConfig;
  smtpTransport?: nodemailer.Transporter;
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

    if (smtpTransport) {
      const info = await smtpTransport.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        ...(replyTo ? { replyTo } : {}),
        ...(params.html ? { html: params.html } : { text: params.text! }),
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
  }>
,
  options?: {
    smtp?: SmtpConfig;
    from?: string;
    replyTo?: string;
  }
): Promise<Array<{ email: string; success: boolean; error?: string }>> {
  const results: Array<{ email: string; success: boolean; error?: string }> =
    [];
  const smtpConfig = options?.smtp ?? envSmtpConfig ?? undefined;
  const smtpTransport = smtpConfig ? createSmtpTransport(smtpConfig) : undefined;

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
    });

    results.push({
      email: email.to,
      success: result.success,
      error: result.error,
    });
  }

  return results;
}
