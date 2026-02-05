// Email template types

export interface EmailTemplate {
  id: string;
  organization_id: string;
  name: string;
  subject: string;
  body: string;
  is_html: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateInsert {
  name: string;
  subject: string;
  body: string;
  is_html?: boolean;
}

export interface EmailTemplateUpdate {
  name?: string;
  subject?: string;
  body?: string;
  is_html?: boolean;
}

// Email template with send count for UI
export interface EmailTemplateWithStats extends EmailTemplate {
  total_sent: number;
  unsent_count?: number; // Calculated based on selected events
}

// Email send tracking
export interface EmailSend {
  id: string;
  template_id: string;
  attendee_email: string;
  organization_id: string;
  sent_at: string;
}

// Request for sending a template
export interface TemplateSendRequest {
  eventIds: string[]; // Empty array means all events
  dateFrom?: string;
  dateTo?: string;
}

// Response from template send
export interface TemplateSendResponse {
  success: boolean;
  message: string;
  totalSent: number;
  totalFailed: number;
  totalSkipped: number; // Already received this template
  errors?: Array<{ email: string; error: string }>;
}

// Template variable context for substitution
export interface TemplateVariableContext {
  attendee: {
    name: string;
    email: string;
  };
  event?: {
    title: string;
    start_time: string;
    timezone?: string;
  } | null;
}
