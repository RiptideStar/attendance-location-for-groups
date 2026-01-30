// Date and timezone utility functions
// All dates are stored in UTC in the database and converted to the event's timezone for display

const FALLBACK_TIMEZONE = "America/New_York";

/**
 * Get the browser's IANA timezone string (e.g., "America/New_York", "America/Los_Angeles")
 * Falls back to "America/New_York" if detection fails.
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/**
 * Get a short timezone abbreviation for display (e.g., "ET", "CT", "PT")
 * @param timezone IANA timezone string
 * @returns Short abbreviation string
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Convert a UTC date to a specific timezone and format for display
 * @param utcDate Date in UTC
 * @param options Formatting options
 * @param timezone IANA timezone string (e.g., "America/New_York")
 * @returns Formatted date string in the specified timezone
 */
export function formatDate(
  utcDate: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
  timezone: string = FALLBACK_TIMEZONE
): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return date.toLocaleString("en-US", {
    ...options,
    timeZone: timezone,
  });
}

/**
 * @deprecated Use formatDate() with an explicit timezone parameter instead
 */
export function formatDateET(
  utcDate: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  return formatDate(utcDate, options, FALLBACK_TIMEZONE);
}

/**
 * Get current date/time
 * @returns Current date
 */
export function getCurrentDateET(): Date {
  return new Date();
}

/**
 * Convert datetime-local input (browser local time) to UTC for database storage
 * The datetime-local input uses the browser's local timezone
 * @param localDatetimeString datetime-local string (e.g., "2024-01-29T14:30")
 * @returns Date object in UTC
 */
export function localToUTC(localDatetimeString: string): Date {
  // new Date() parses datetime-local strings as local time and stores internally as UTC
  const date = new Date(localDatetimeString);
  return date;
}

/**
 * Convert UTC date to datetime-local format for form inputs
 * Uses the browser's local timezone so the input matches what the admin sees
 * @param utcDate Date in UTC
 * @returns datetime-local string (YYYY-MM-DDTHH:mm)
 */
export function utcToLocalInput(utcDate: Date | string): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

  // Use the browser's local timezone via Date local methods
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Check if current time is within the event registration window
 * @param eventStart Event start time (UTC)
 * @param eventEnd Event end time (UTC)
 * @param windowBeforeMinutes Minutes before event start to open registration
 * @param windowAfterMinutes Minutes after event end to keep registration open
 * @returns true if within window, false otherwise
 */
export function isWithinEventWindow(
  eventStart: Date | string,
  eventEnd: Date | string,
  windowBeforeMinutes: number = 30,
  windowAfterMinutes: number = 30
): boolean {
  const now = new Date();
  const start =
    typeof eventStart === "string" ? new Date(eventStart) : eventStart;
  const end = typeof eventEnd === "string" ? new Date(eventEnd) : eventEnd;

  const windowStart = new Date(
    start.getTime() - windowBeforeMinutes * 60 * 1000
  );
  const windowEnd = new Date(end.getTime() + windowAfterMinutes * 60 * 1000);

  return now >= windowStart && now <= windowEnd;
}

/**
 * Get the registration window status for an event
 * @param eventStart Event start time (UTC)
 * @param eventEnd Event end time (UTC)
 * @param windowBeforeMinutes Minutes before event start
 * @param windowAfterMinutes Minutes after event end
 * @param isClosed Manual close flag
 * @returns Status of the registration window
 */
export function getRegistrationStatus(
  eventStart: Date | string,
  eventEnd: Date | string,
  windowBeforeMinutes: number = 30,
  windowAfterMinutes: number = 30,
  isClosed: boolean = false
):
  | "not_started"
  | "open"
  | "closed"
  | "manually_closed" {
  if (isClosed) {
    return "manually_closed";
  }

  const now = new Date();
  const start =
    typeof eventStart === "string" ? new Date(eventStart) : eventStart;
  const end = typeof eventEnd === "string" ? new Date(eventEnd) : eventEnd;

  const windowStart = new Date(
    start.getTime() - windowBeforeMinutes * 60 * 1000
  );
  const windowEnd = new Date(end.getTime() + windowAfterMinutes * 60 * 1000);

  if (now < windowStart) {
    return "not_started";
  } else if (now > windowEnd) {
    return "closed";
  } else {
    return "open";
  }
}

/**
 * Calculate time until registration opens
 * @param eventStart Event start time (UTC)
 * @param windowBeforeMinutes Minutes before event start
 * @returns Milliseconds until registration opens (negative if already open)
 */
export function getTimeUntilRegistration(
  eventStart: Date | string,
  windowBeforeMinutes: number = 30
): number {
  const now = new Date();
  const start =
    typeof eventStart === "string" ? new Date(eventStart) : eventStart;
  const windowStart = new Date(
    start.getTime() - windowBeforeMinutes * 60 * 1000
  );

  return windowStart.getTime() - now.getTime();
}

/**
 * Format duration in a human-readable way
 * @param milliseconds Duration in milliseconds
 * @returns Formatted string (e.g., "2 hours, 15 minutes")
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}, ${hours % 24} hour${
      (hours % 24) !== 1 ? "s" : ""
    }`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}, ${minutes % 60} minute${
      (minutes % 60) !== 1 ? "s" : ""
    }`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}

/**
 * Validate that end time is after start time
 * @param start Start time
 * @param end End time
 * @returns true if valid, false otherwise
 */
export function isValidTimeRange(
  start: Date | string,
  end: Date | string
): boolean {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  return endDate > startDate;
}
