"use client";

import { useState, useMemo } from "react";
import { formatDate, getBrowserTimezone } from "@/lib/utils/date-helpers";
import type { AttendeeWithEvent } from "@/types/attendance";

interface AttendeeTableProps {
  attendees: AttendeeWithEvent[];
  showEventColumn?: boolean;
  selectable?: boolean;
  onDelete?: (ids: string[]) => Promise<void>;
}

export function AttendeeTable({
  attendees,
  showEventColumn = true,
  selectable = false,
  onDelete,
}: AttendeeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
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

  // Selection helpers
  const filteredIds = useMemo(
    () => new Set(filteredAttendees.map((a) => a.id)),
    [filteredAttendees]
  );

  const selectedFilteredIds = useMemo(
    () => new Set([...selectedIds].filter((id) => filteredIds.has(id))),
    [selectedIds, filteredIds]
  );

  const allFilteredSelected =
    filteredAttendees.length > 0 &&
    filteredAttendees.every((a) => selectedIds.has(a.id));

  const someFilteredSelected =
    filteredAttendees.some((a) => selectedIds.has(a.id)) && !allFilteredSelected;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered
      const newSelected = new Set(selectedIds);
      filteredAttendees.forEach((a) => newSelected.delete(a.id));
      setSelectedIds(newSelected);
    } else {
      // Select all filtered
      const newSelected = new Set(selectedIds);
      filteredAttendees.forEach((a) => newSelected.add(a.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async () => {
    if (!onDelete || selectedFilteredIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFilteredIds.size} attendee record${selectedFilteredIds.size !== 1 ? "s" : ""}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await onDelete([...selectedFilteredIds]);
      setSelectedIds(new Set());
    } finally {
      setDeleting(false);
    }
  };

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">No attendees yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
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

        {selectable && selectedFilteredIds.size > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Deleting...
              </>
            ) : (
              <>Delete ({selectedFilteredIds.size})</>
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
              )}
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
              <tr
                key={attendee.id}
                className={`hover:bg-gray-50 ${
                  selectable && selectedIds.has(attendee.id) ? "bg-blue-50" : ""
                }`}
              >
                {selectable && (
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(attendee.id)}
                      onChange={() => toggleSelect(attendee.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                )}
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
