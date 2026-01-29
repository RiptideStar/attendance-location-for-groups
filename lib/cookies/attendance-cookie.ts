// Cookie management for preventing duplicate check-ins
// Uses event-specific cookies with 24-hour expiry

const COOKIE_PREFIX = "attended_";
const COOKIE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if user has already checked in to an event (server-side)
 * @param eventId Event ID to check
 * @param cookieHeader Cookie header from request
 * @returns true if user has attended, false otherwise
 */
export function hasAttendedServer(
  eventId: string,
  cookieHeader: string | null
): boolean {
  if (!cookieHeader) return false;

  const cookieName = `${COOKIE_PREFIX}${eventId}`;
  return cookieHeader.includes(`${cookieName}=true`);
}

/**
 * Create a cookie value for marking attendance
 * @param eventId Event ID
 * @returns Cookie string to set in Set-Cookie header
 */
export function createAttendanceCookie(eventId: string): string {
  const cookieName = `${COOKIE_PREFIX}${eventId}`;
  const expires = new Date(Date.now() + COOKIE_DURATION_MS);

  return `${cookieName}=true; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

/**
 * Check if user has already checked in to an event (client-side)
 * @param eventId Event ID to check
 * @returns true if user has attended, false otherwise
 */
export function hasAttendedClient(eventId: string): boolean {
  if (typeof document === "undefined") return false;

  const cookieName = `${COOKIE_PREFIX}${eventId}`;
  return document.cookie.includes(`${cookieName}=true`);
}

/**
 * Mark user as attended on client-side (backup, mainly for testing)
 * @param eventId Event ID
 */
export function markAttendedClient(eventId: string): void {
  if (typeof document === "undefined") return;

  const cookieName = `${COOKIE_PREFIX}${eventId}`;
  const expires = new Date(Date.now() + COOKIE_DURATION_MS);

  document.cookie = `${cookieName}=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

/**
 * Clear attendance cookie for an event (for testing)
 * @param eventId Event ID
 */
export function clearAttendanceCookie(eventId: string): void {
  if (typeof document === "undefined") return;

  const cookieName = `${COOKIE_PREFIX}${eventId}`;
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
