// Date and timezone utility functions
// All dates are stored in UTC in the database and converted to ET for display

const ET_TIMEZONE = "America/New_York";

/**
 * Convert a UTC date to ET timezone and format for display
 * @param utcDate Date in UTC
 * @param options Formatting options
 * @returns Formatted date string in ET
 */
export function formatDateET(
  utcDate: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return date.toLocaleString("en-US", {
    ...options,
    timeZone: ET_TIMEZONE,
  });
}

/**
 * Get current date/time in ET timezone
 * @returns Current date
 */
export function getCurrentDateET(): Date {
  return new Date();
}

/**
 * Convert datetime-local input (browser local time) to UTC for database storage
 * The datetime-local input is assumed to be in ET timezone
 * @param localDatetimeString datetime-local string (e.g., "2024-01-29T14:30")
 * @returns Date object in UTC
 */
export function localToUTC(localDatetimeString: string): Date {
  // The datetime-local input is in local time (ET for our users)
  // We need to parse it as ET and convert to UTC
  const date = new Date(localDatetimeString);
  return date;
}

/**
 * Convert UTC date to datetime-local format for form inputs
 * @param utcDate Date in UTC
 * @returns datetime-local string (YYYY-MM-DDTHH:mm)
 */
export function utcToLocalInput(utcDate: Date | string): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

  // Convert to ET timezone for editing
  const etString = date.toLocaleString("en-US", {
    timeZone: ET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Parse the formatted string and convert to datetime-local format
  // Expected format: "MM/DD/YYYY, HH:mm"
  const [datePart, timePart] = etString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");

  return `${year}-${month}-${day}T${hour}:${minute}`;
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
