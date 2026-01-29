// Database types for Supabase
// To generate these types automatically, run:
// npx supabase gen types typescript --project-id <project-id> > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          start_time: string;
          end_time: string;
          location_address: string;
          location_lat: number;
          location_lng: number;
          registration_window_before_minutes: number;
          registration_window_after_minutes: number;
          location_radius_meters: number;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start_time: string;
          end_time: string;
          location_address: string;
          location_lat: number;
          location_lng: number;
          registration_window_before_minutes?: number;
          registration_window_after_minutes?: number;
          location_radius_meters?: number;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_time?: string;
          end_time?: string;
          location_address?: string;
          location_lat?: number;
          location_lng?: number;
          registration_window_before_minutes?: number;
          registration_window_after_minutes?: number;
          location_radius_meters?: number;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendees: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          email: string;
          check_in_time: string;
          check_in_lat: number;
          check_in_lng: number;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          email: string;
          check_in_time?: string;
          check_in_lat: number;
          check_in_lng: number;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          email?: string;
          check_in_time?: string;
          check_in_lat?: number;
          check_in_lng?: number;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
