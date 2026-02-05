import crypto from "crypto";

const DEFAULT_TTL_MS = 60 * 1000;
const CLOCK_SKEW_MS = 15 * 1000;

export function getQrTokenTtlMs(): number {
  const envTtl = Number(process.env.QR_CODE_TTL_MS || "");
  return Number.isFinite(envTtl) && envTtl > 0 ? envTtl : DEFAULT_TTL_MS;
}

function getQrSecret(): string | null {
  return process.env.QR_CODE_SECRET || process.env.NEXTAUTH_SECRET || null;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createQrToken(eventId: string, issuedAtMs = Date.now()): string {
  const secret = getQrSecret();
  if (!secret) {
    throw new Error("QR token secret not configured");
  }

  const payload = `${eventId}.${issuedAtMs}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyQrToken(
  eventId: string,
  token: string | null | undefined
): { valid: boolean; reason?: string } {
  if (!token) {
    return { valid: false, reason: "missing" };
  }

  const secret = getQrSecret();
  if (!secret) {
    return { valid: false, reason: "secret_missing" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, reason: "malformed" };
  }

  const [tokenEventId, issuedAtRaw, signature] = parts;
  if (tokenEventId !== eventId) {
    return { valid: false, reason: "event_mismatch" };
  }

  const issuedAtMs = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAtMs)) {
    return { valid: false, reason: "malformed" };
  }

  const payload = `${tokenEventId}.${issuedAtMs}`;
  const expectedSignature = sign(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "invalid_signature" };
  }
  const signatureMatches = crypto.timingSafeEqual(
    signatureBuffer,
    expectedBuffer
  );

  if (!signatureMatches) {
    return { valid: false, reason: "invalid_signature" };
  }

  const now = Date.now();
  const ttlMs = getQrTokenTtlMs();
  if (issuedAtMs - now > CLOCK_SKEW_MS) {
    return { valid: false, reason: "from_future" };
  }
  if (now - issuedAtMs > ttlMs) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true };
}
