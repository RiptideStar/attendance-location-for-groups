import { formatDate } from "@/lib/utils/date-helpers";
import type { TemplateVariableContext } from "@/types/email-template";

/**
 * Parse first name from full name
 * Takes the first word before any whitespace
 */
export function parseFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  const firstSpace = trimmed.search(/\s/);
  if (firstSpace === -1) {
    return trimmed; // Single word name
  }
  return trimmed.substring(0, firstSpace);
}

/**
 * Parse last name from full name
 * Takes everything after the first word, or empty if single word
 */
export function parseLastName(fullName: string): string {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return ""; // Single word name
  }
  return parts[parts.length - 1];
}

/**
 * Available template variables
 */
export const TEMPLATE_VARIABLES = [
  {
    variable: "{{firstName}}",
    description: "First word of attendee name",
    example: '"John" from "John Smith"',
  },
  {
    variable: "{{lastName}}",
    description: "Last word of attendee name",
    example: '"Smith" from "John Smith"',
  },
  {
    variable: "{{name}}",
    description: "Full attendee name",
    example: '"John Smith"',
  },
  {
    variable: "{{email}}",
    description: "Attendee email address",
    example: '"john@example.com"',
  },
  {
    variable: "{{eventName}}",
    description: "Event title",
    example: '"Weekly Team Meeting"',
  },
  {
    variable: "{{eventDate}}",
    description: "Event date",
    example: '"Feb 4, 2026"',
  },
] as const;

/**
 * Substitute template variables with actual values
 */
export function substituteVariables(
  template: string,
  context: TemplateVariableContext
): string {
  const { attendee, event } = context;

  const firstName = parseFirstName(attendee.name);
  const lastName = parseLastName(attendee.name);

  let result = template
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName)
    .replace(/\{\{name\}\}/g, attendee.name)
    .replace(/\{\{email\}\}/g, attendee.email);

  if (event) {
    const eventDate = formatDate(
      event.start_time,
      { dateStyle: "medium" },
      event.timezone || "America/New_York"
    );
    result = result
      .replace(/\{\{eventName\}\}/g, event.title)
      .replace(/\{\{eventDate\}\}/g, eventDate);
  } else {
    // Remove event variables if no event context
    result = result
      .replace(/\{\{eventName\}\}/g, "")
      .replace(/\{\{eventDate\}\}/g, "");
  }

  return result;
}

/**
 * Check if a template contains any variables
 */
export function hasVariables(template: string): boolean {
  return /\{\{(firstName|lastName|name|email|eventName|eventDate)\}\}/.test(
    template
  );
}

/**
 * Get list of variables used in a template
 */
export function getUsedVariables(template: string): string[] {
  const matches = template.match(
    /\{\{(firstName|lastName|name|email|eventName|eventDate)\}\}/g
  );
  if (!matches) return [];
  return [...new Set(matches)];
}
