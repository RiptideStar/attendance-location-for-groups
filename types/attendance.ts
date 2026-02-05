import type { Database } from "./database";

// Attendee type from database
export type Attendee = Database["public"]["Tables"]["attendees"]["Row"];
export type AttendeeInsert = Database["public"]["Tables"]["attendees"]["Insert"];

// Attendee with event details (for admin views)
export interface AttendeeWithEvent extends Attendee {
  event_title: string;
  event_start_time: string;
  event_location: string;
  event_timezone: string | null;
}

// Check-in form data
export interface CheckInFormData {
  name: string;
  email: string;
}

// Check-in submission data (includes location)
export interface CheckInSubmission extends CheckInFormData {
  eventId: string;
  lat: number;
  lng: number;
  qrToken: string;
}

// Check-in response types
export interface CheckInSuccess {
  success: true;
  message: string;
  attendee: Attendee;
}

export interface CheckInError {
  success: false;
  error: string;
  code?:
    | "duplicate"
    | "outside_radius"
    | "outside_window"
    | "event_closed"
    | "event_not_found"
    | "qr_required"
    | "qr_invalid"
    | "validation_error"
    | "server_error";
}

export type CheckInResponse = CheckInSuccess | CheckInError;
