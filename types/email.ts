// Email blast types

export interface EmailBlastRecipient {
  email: string;
  name: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded content
  contentType: string;
}

export interface EmailBlastRequest {
  eventIds: string[]; // Empty array means "all events"
  dateFrom?: string; // Optional ISO date string for filtering
  dateTo?: string; // Optional ISO date string for filtering
  firstTimeOnly?: boolean; // Only attendees whose first event is the selected event
  subject: string;
  body: string;
  isHtml: boolean; // Whether body is HTML or plain text
  attachments?: EmailAttachment[];
}

export interface EmailBlastPreview {
  recipientCount: number;
  recipients: EmailBlastRecipient[]; // First 10 for preview
  totalEvents: number;
  eventTitles: string[]; // List of event titles included
}

export interface EmailBlastResponse {
  success: boolean;
  message: string;
  totalSent: number;
  totalFailed: number;
  errors?: EmailBlastError[];
}

export interface EmailBlastError {
  email: string;
  error: string;
}

// For internal tracking
export interface EmailSendResult {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}
