"use client";

import {
  formatDate,
  getBrowserTimezone,
} from "@/lib/utils/date-helpers";
import type { EventWithCount } from "@/types/event";

interface EventMultiSelectProps {
  events: EventWithCount[];
  loading: boolean;
  selectedEventIds: string[];
  onSelectionChange: (ids: string[]) => void;
  selectAll: boolean;
  onSelectAllChange: (selectAll: boolean) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  firstTimeOnly: boolean;
  onFirstTimeOnlyChange: (firstTimeOnly: boolean) => void;
  onNext: () => void;
  nextButtonText?: string;
}

export function EventMultiSelect({
  events,
  loading,
  selectedEventIds,
  onSelectionChange,
  selectAll,
  onSelectAllChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  firstTimeOnly,
  onFirstTimeOnlyChange,
  onNext,
  nextButtonText = "Next: Compose Email",
}: EventMultiSelectProps) {
  const browserTimezone = getBrowserTimezone();

  const handleToggleEvent = (eventId: string) => {
    if (selectedEventIds.includes(eventId)) {
      onSelectionChange(selectedEventIds.filter((id) => id !== eventId));
    } else {
      onSelectionChange([...selectedEventIds, eventId]);
    }
    onSelectAllChange(false);
  };

  const handleSelectAll = () => {
    onSelectAllChange(true);
    onSelectionChange([]);
  };

  const handleClearSelection = () => {
    onSelectAllChange(false);
    onSelectionChange([]);
  };

  const isValid = selectAll || selectedEventIds.length > 0;

  // Calculate total attendees for selected events
  const totalAttendees = selectAll
    ? events.reduce((sum, e) => sum + (e.attendee_count || 0), 0)
    : selectedEventIds.reduce((sum, id) => {
        const event = events.find((e) => e.id === id);
        return sum + (event?.attendee_count || 0);
      }, 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Select Events</h2>
      <p className="text-gray-600 mb-6">
        Choose which events&apos; attendees should receive this email. Duplicate
        emails across events will be automatically deduplicated.
      </p>

      {/* Date filter */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Events from
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Events until
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Audience filter */}
      <div className="mb-6">
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={firstTimeOnly}
            onChange={(e) => onFirstTimeOnlyChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <span>
            Only first-time attendees (no events before the selected event)
            <span className="block text-xs text-gray-500 mt-1">
              Uses each attendee&apos;s earliest event to determine eligibility.
            </span>
          </span>
        </label>
      </div>

      {/* Select all / clear buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className={`px-4 py-2 rounded-lg text-sm ${
            selectAll
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Select All Events
        </button>
        <button
          onClick={handleClearSelection}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          Clear Selection
        </button>
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 rounded-lg">
          <p className="text-gray-600">No events found</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg divide-y">
          {events.map((event) => (
            <label
              key={event.id}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                selectAll || selectedEventIds.includes(event.id)
                  ? "bg-blue-50"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selectAll || selectedEventIds.includes(event.id)}
                onChange={() => handleToggleEvent(event.id)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300"
                disabled={selectAll}
              />
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">{event.title}</div>
                <div className="text-sm text-gray-500">
                  {formatDate(
                    event.start_time,
                    { dateStyle: "medium", timeStyle: "short" },
                    event.timezone || browserTimezone
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {event.attendee_count} attendee
                {event.attendee_count !== 1 ? "s" : ""}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Summary and next button */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectAll
            ? `All ${events.length} events selected`
            : `${selectedEventIds.length} event${
                selectedEventIds.length !== 1 ? "s" : ""
              } selected`}{" "}
          ({totalAttendees} attendees before deduplication)
          {firstTimeOnly ? " · First-time filter enabled" : ""}
        </div>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {nextButtonText}
        </button>
      </div>
    </div>
  );
}
