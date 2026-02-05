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

  const events = useMemo(() => {
    const uniqueEvents = new Map<string, string>();
    attendees.forEach((a) => {
      if (a.event_id && a.event_title) {
        uniqueEvents.set(a.event_id, a.event_title);
      }
    });
    return Array.from(uniqueEvents.entries());
  }, [attendees]);

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
      const newSelected = new Set(selectedIds);
      filteredAttendees.forEach((a) => newSelected.delete(a.id));
      setSelectedIds(newSelected);
    } else {
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
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="font-medium text-gray-900 mb-1">No attendees yet</h3>
        <p className="text-sm text-gray-500">Attendees will appear here once they check in</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {showEventColumn && events.length > 1 && (
          <div className="sm:w-56">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="input"
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
            className="btn btn-danger"
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete ({selectedFilteredIds.size})
              </>
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </th>
              )}
              <th>Name</th>
              <th>Email</th>
              {showEventColumn && <th>Event</th>}
              <th>Check-in Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendees.map((attendee) => (
              <tr
                key={attendee.id}
                className={selectable && selectedIds.has(attendee.id) ? "!bg-indigo-50" : ""}
              >
                {selectable && (
                  <td className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(attendee.id)}
                      onChange={() => toggleSelect(attendee.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </td>
                )}
                <td>
                  <span className="font-medium text-gray-900">{attendee.name}</span>
                </td>
                <td className="text-gray-600">{attendee.email}</td>
                {showEventColumn && (
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{attendee.event_title}</div>
                      {attendee.event_start_time && (
                        <div className="text-xs text-gray-500">
                          {formatDate(attendee.event_start_time, { dateStyle: "short", timeStyle: "short" }, attendee.event_timezone || browserTimezone)}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className="text-gray-600">
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
      <div className="text-sm text-gray-500">
        Showing {filteredAttendees.length} of {attendees.length} attendee
        {attendees.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
