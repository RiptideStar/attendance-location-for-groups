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
      organizations: {
        Row: {
          id: string;
          username: string;
          name: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          name: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          name?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
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
          recurring_event_id: string | null;
          organization_id: string;
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
          recurring_event_id?: string | null;
          organization_id: string;
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
          recurring_event_id?: string | null;
          organization_id?: string;
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
          organization_id: string;
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
          organization_id: string;
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
          organization_id?: string;
          created_at?: string;
        };
      };
      organization_locations: {
        Row: {
          id: string;
          organization_id: string;
          label: string;
          address: string;
          lat: number;
          lng: number;
          is_favorite: boolean;
          last_used_at: string;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          label: string;
          address: string;
          lat: number;
          lng: number;
          is_favorite?: boolean;
          last_used_at?: string;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          label?: string;
          address?: string;
          lat?: number;
          lng?: number;
          is_favorite?: boolean;
          last_used_at?: string;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_events: {
        Row: {
          id: string;
          title: string;
          location_address: string;
          location_lat: number;
          location_lng: number;
          start_time: string;
          duration_minutes: number;
          recurrence_type: "weekly" | "monthly_date" | "monthly_weekday";
          recurrence_interval: number;
          recurrence_days: number[] | null;
          recurrence_monthly_date: number | null;
          recurrence_monthly_week: number | null;
          recurrence_monthly_weekday: number | null;
          start_date: string;
          end_date: string | null;
          registration_window_before_minutes: number;
          registration_window_after_minutes: number;
          location_radius_meters: number;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          location_address: string;
          location_lat: number;
          location_lng: number;
          start_time: string;
          duration_minutes: number;
          recurrence_type: "weekly" | "monthly_date" | "monthly_weekday";
          recurrence_interval?: number;
          recurrence_days?: number[] | null;
          recurrence_monthly_date?: number | null;
          recurrence_monthly_week?: number | null;
          recurrence_monthly_weekday?: number | null;
          start_date: string;
          end_date?: string | null;
          registration_window_before_minutes?: number;
          registration_window_after_minutes?: number;
          location_radius_meters?: number;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          location_address?: string;
          location_lat?: number;
          location_lng?: number;
          start_time?: string;
          duration_minutes?: number;
          recurrence_type?: "weekly" | "monthly_date" | "monthly_weekday";
          recurrence_interval?: number;
          recurrence_days?: number[] | null;
          recurrence_monthly_date?: number | null;
          recurrence_monthly_week?: number | null;
          recurrence_monthly_weekday?: number | null;
          start_date?: string;
          end_date?: string | null;
          registration_window_before_minutes?: number;
          registration_window_after_minutes?: number;
          location_radius_meters?: number;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_organization_location: {
        Args: {
          p_organization_id: string;
          p_label: string;
          p_address: string;
          p_lat: number;
          p_lng: number;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
