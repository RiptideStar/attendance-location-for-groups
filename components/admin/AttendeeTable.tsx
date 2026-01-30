"use client";

import { useState, useMemo } from "react";
import { formatDate, getBrowserTimezone } from "@/lib/utils/date-helpers";
import type { AttendeeWithEvent } from "@/types/attendance";

interface AttendeeTableProps {
  attendees: AttendeeWithEvent[];
  showEventColumn?: boolean;
}

export function AttendeeTable({
  attendees,
  showEventColumn = true,
}: AttendeeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const browserTimezone = getBrowserTimezone();

  // Get unique events for filter dropdown
  const events = useMemo(() => {
    const uniqueEvents = new Map<string, string>();
    attendees.forEach((a) => {
      if (a.event_id && a.event_title) {
        uniqueEvents.set(a.event_id, a.event_title);
      }
    });
    return Array.from(uniqueEvents.entries());
  }, [attendees]);

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter((attendee) => {
      const matchesSearch =
        !searchTerm ||
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEvent =
        eventFilter === "all" || attendee.event_id === eventFilter;

      return matchesSearch && matchesEvent;
    });
  }, [attendees, searchTerm, eventFilter]);

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">No attendees yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showEventColumn && events.length > 1 && (
          <div className="sm:w-64">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              {events.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              {showEventColumn && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAttendees.map((attendee) => (
              <tr key={attendee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {attendee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {attendee.email}
                </td>
                {showEventColumn && (
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <div className="font-medium">{attendee.event_title}</div>
                      {attendee.event_start_time && (
                        <div className="text-xs text-gray-500">
                          {formatDate(attendee.event_start_time, { dateStyle: "short", timeStyle: "short" }, attendee.event_timezone || browserTimezone)}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(attendee.check_in_time, { dateStyle: "short", timeStyle: "short" }, browserTimezone)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAttendees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No attendees found matching your search
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredAttendees.length} of {attendees.length} attendee
        {attendees.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
