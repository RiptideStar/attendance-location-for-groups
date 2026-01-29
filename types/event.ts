import type { Database } from "./database";

// Event type from database
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

// Event with attendee count (for admin dashboard)
export interface EventWithCount extends Event {
  attendee_count: number;
}

// Form data for creating/editing events
export interface EventFormData {
  title: string;
  startTime: string; // ISO datetime-local format
  endTime: string; // ISO datetime-local format
  locationAddress: string;
  locationLat: number;
  locationLng: number;
}

// Event registration window status
export type RegistrationStatus =
  | "not_started" // Before registration window
  | "open" // Within registration window
  | "closed" // After registration window or manually closed
  | "event_not_found"; // Event doesn't exist
