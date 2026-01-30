import type { Database } from "./database";

// Recurring event types from database
export type RecurringEvent =
  Database["public"]["Tables"]["recurring_events"]["Row"];
export type RecurringEventInsert =
  Database["public"]["Tables"]["recurring_events"]["Insert"];
export type RecurringEventUpdate =
  Database["public"]["Tables"]["recurring_events"]["Update"];

// Recurrence type
export type RecurrenceType = "weekly" | "monthly_date" | "monthly_weekday";

// Days of week (0 = Sunday, 6 = Saturday)
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Week ordinals for monthly weekday patterns
export const WEEK_ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"] as const;

// Form data for creating/editing recurring events
export interface RecurringEventFormData {
  title: string;
  startDate: string; // ISO date format (YYYY-MM-DD)
  startTime: string; // Time in HH:MM format
  durationMinutes: number;
  endDate: string | null; // ISO date format or null for no end date
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number; // e.g., every 2 weeks
  // For weekly recurrence
  recurrenceDays: number[]; // Array of day numbers (0-6)
  // For monthly date recurrence
  recurrenceMonthlyDate: number | null; // Day of month (1-31)
  // For monthly weekday recurrence
  recurrenceMonthlyWeek: number | null; // 1-5
  recurrenceMonthlyWeekday: number | null; // 0-6
}

// Recurring event with generated event count
export interface RecurringEventWithCount extends RecurringEvent {
  event_count: number;
}
