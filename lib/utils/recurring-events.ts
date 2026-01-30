import type { RecurringEvent } from "@/types/recurring-event";
import type { EventInsert } from "@/types/event";

/**
 * Generates individual event instances from a recurring event pattern
 * @param recurringEvent The recurring event template
 * @param maxOccurrences Maximum number of occurrences to generate (default: 100)
 * @returns Array of event insert objects
 */
export function generateEventInstances(
  recurringEvent: RecurringEvent,
  maxOccurrences: number = 100
): EventInsert[] {
  const events: EventInsert[] = [];
  const startDate = new Date(recurringEvent.start_date);
  const endDate = recurringEvent.end_date
    ? new Date(recurringEvent.end_date)
    : null;

  // Parse start time (HH:MM:SS or HH:MM format)
  const [hours, minutes] = recurringEvent.start_time.split(":").map(Number);

  let currentDate = new Date(startDate);
  let occurrences = 0;

  // Generate events up to maxOccurrences or end_date
  while (occurrences < maxOccurrences) {
    if (endDate && currentDate > endDate) {
      break;
    }

    const eventDate = getNextOccurrence(
      currentDate,
      recurringEvent,
      occurrences === 0
    );

    if (!eventDate || (endDate && eventDate > endDate)) {
      break;
    }

    // Set the time of day for the event
    const eventStartTime = new Date(eventDate);
    eventStartTime.setHours(hours, minutes, 0, 0);

    const eventEndTime = new Date(eventStartTime);
    eventEndTime.setMinutes(
      eventEndTime.getMinutes() + recurringEvent.duration_minutes
    );

    events.push({
      title: recurringEvent.title,
      start_time: eventStartTime.toISOString(),
      end_time: eventEndTime.toISOString(),
      location_address: recurringEvent.location_address,
      location_lat: recurringEvent.location_lat,
      location_lng: recurringEvent.location_lng,
      registration_window_before_minutes:
        recurringEvent.registration_window_before_minutes,
      registration_window_after_minutes:
        recurringEvent.registration_window_after_minutes,
      location_radius_meters: recurringEvent.location_radius_meters,
      recurring_event_id: recurringEvent.id,
    });

    currentDate = new Date(eventDate);
    currentDate.setDate(currentDate.getDate() + 1); // Move to next day
    occurrences++;
  }

  return events;
}

/**
 * Get the next occurrence date based on the recurrence pattern
 */
function getNextOccurrence(
  fromDate: Date,
  recurringEvent: RecurringEvent,
  isFirst: boolean
): Date | null {
  const { recurrence_type, recurrence_interval } = recurringEvent;

  if (isFirst) {
    // For the first occurrence, check if fromDate matches the pattern
    if (
      recurrence_type === "weekly" &&
      recurringEvent.recurrence_days?.includes(fromDate.getDay())
    ) {
      return new Date(fromDate);
    } else if (recurrence_type === "monthly_date") {
      if (fromDate.getDate() === recurringEvent.recurrence_monthly_date) {
        return new Date(fromDate);
      }
    } else if (recurrence_type === "monthly_weekday") {
      const weekOfMonth = getWeekOfMonth(fromDate);
      if (
        weekOfMonth === recurringEvent.recurrence_monthly_week &&
        fromDate.getDay() === recurringEvent.recurrence_monthly_weekday
      ) {
        return new Date(fromDate);
      }
    }
  }

  // Find the next occurrence
  const maxIterations = 365 * 2; // Prevent infinite loops (max 2 years ahead)
  let iterations = 0;
  let candidate = new Date(fromDate);

  while (iterations < maxIterations) {
    candidate.setDate(candidate.getDate() + 1);
    iterations++;

    if (recurrence_type === "weekly") {
      // Check if this day of week is in the recurrence_days array
      if (recurringEvent.recurrence_days?.includes(candidate.getDay())) {
        // Check if it's the right interval
        const daysSinceStart = Math.floor(
          (candidate.getTime() - new Date(recurringEvent.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const weeksSinceStart = Math.floor(daysSinceStart / 7);

        if (weeksSinceStart % recurrence_interval === 0) {
          return candidate;
        }
      }
    } else if (recurrence_type === "monthly_date") {
      // Check if this is the right day of the month
      if (candidate.getDate() === recurringEvent.recurrence_monthly_date) {
        const monthsSinceStart = getMonthDifference(
          new Date(recurringEvent.start_date),
          candidate
        );

        if (monthsSinceStart % recurrence_interval === 0) {
          return candidate;
        }
      }
    } else if (recurrence_type === "monthly_weekday") {
      // Check if this matches the weekday pattern (e.g., 2nd Tuesday)
      const weekOfMonth = getWeekOfMonth(candidate);
      if (
        weekOfMonth === recurringEvent.recurrence_monthly_week &&
        candidate.getDay() === recurringEvent.recurrence_monthly_weekday
      ) {
        const monthsSinceStart = getMonthDifference(
          new Date(recurringEvent.start_date),
          candidate
        );

        if (monthsSinceStart % recurrence_interval === 0) {
          return candidate;
        }
      }
    }
  }

  return null;
}

/**
 * Get which week of the month a date falls in (1-5)
 */
function getWeekOfMonth(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Calculate the number of months between two dates
 */
function getMonthDifference(startDate: Date, endDate: Date): number {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  );
}

/**
 * Validates a recurring event pattern
 */
export function validateRecurringEvent(
  recurringEvent: Partial<RecurringEvent>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!recurringEvent.title?.trim()) {
    errors.push("Title is required");
  }

  if (!recurringEvent.start_date) {
    errors.push("Start date is required");
  }

  if (!recurringEvent.start_time) {
    errors.push("Start time is required");
  }

  if (
    !recurringEvent.duration_minutes ||
    recurringEvent.duration_minutes <= 0
  ) {
    errors.push("Duration must be greater than 0");
  }

  if (!recurringEvent.recurrence_type) {
    errors.push("Recurrence type is required");
  }

  // Validate specific recurrence pattern fields
  if (recurringEvent.recurrence_type === "weekly") {
    if (
      !recurringEvent.recurrence_days ||
      recurringEvent.recurrence_days.length === 0
    ) {
      errors.push("At least one day must be selected for weekly recurrence");
    }
  } else if (recurringEvent.recurrence_type === "monthly_date") {
    if (!recurringEvent.recurrence_monthly_date) {
      errors.push("Monthly date is required for monthly date recurrence");
    } else if (
      recurringEvent.recurrence_monthly_date < 1 ||
      recurringEvent.recurrence_monthly_date > 31
    ) {
      errors.push("Monthly date must be between 1 and 31");
    }
  } else if (recurringEvent.recurrence_type === "monthly_weekday") {
    if (!recurringEvent.recurrence_monthly_week) {
      errors.push("Week of month is required for monthly weekday recurrence");
    }
    if (recurringEvent.recurrence_monthly_weekday === null) {
      errors.push("Weekday is required for monthly weekday recurrence");
    }
  }

  if (
    recurringEvent.location_lat !== undefined &&
    (recurringEvent.location_lat < -90 || recurringEvent.location_lat > 90)
  ) {
    errors.push("Invalid latitude value");
  }

  if (
    recurringEvent.location_lng !== undefined &&
    (recurringEvent.location_lng < -180 || recurringEvent.location_lng > 180)
  ) {
    errors.push("Invalid longitude value");
  }

  return { valid: errors.length === 0, errors };
}
