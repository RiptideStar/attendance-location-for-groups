import crypto from "crypto";

const KEY_ENV = process.env.SMTP_SECRET_KEY;

function getKey(): Buffer | null {
  if (!KEY_ENV) {
    return null;
  }
  const key = Buffer.from(KEY_ENV, "base64");
  if (key.length !== 32) {
    throw new Error("SMTP_SECRET_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function encryptSmtpPassword(plaintext: string): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const key = getKey();
  if (!key) {
    throw new Error("SMTP_SECRET_KEY is required to encrypt SMTP passwords");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSmtpPassword(payload: {
  ciphertext: string;
  iv: string;
  tag: string;
}): string {
  const key = getKey();
  if (!key) {
    throw new Error("SMTP_SECRET_KEY is required to decrypt SMTP passwords");
  }

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const encrypted = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

