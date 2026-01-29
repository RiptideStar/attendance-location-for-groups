"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import { formatDateET, getRegistrationStatus } from "@/lib/utils/date-helpers";
import type { EventWithCount } from "@/types/event";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${eventTitle}"? This will also delete all attendance records for this event.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Refresh events list
      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const handleToggleClosed = async (eventId: string, isClosed: boolean) => {
    try {
      const url = `/api/events/${eventId}/close`;
      const response = await fetch(url, {
        method: isClosed ? "DELETE" : "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      // Refresh events list
      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update event");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Penn CBC Attendance - Admin
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <Link
              href="/admin"
              className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              Events
            </Link>
            <Link
              href="/admin/attendees"
              className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              All Attendees
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Events</h2>
          <Link
            href="/admin/events/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Event
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No events yet</p>
            <Link
              href="/admin/events/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Event
            </Link>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="grid gap-6">
            {events.map((event) => {
              const status = getRegistrationStatus(
                event.start_time,
                event.end_time,
                event.registration_window_before_minutes,
                event.registration_window_after_minutes,
                event.is_closed
              );

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-600">
                              {formatDateET(event.start_time)} -{" "}
                              {formatDateET(event.end_time, { timeStyle: "short" })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {event.location_address}
                          </p>
                        </div>
                        <div>
                          {status === "open" && (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                              Open
                            </span>
                          )}
                          {status === "not_started" && (
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              Upcoming
                            </span>
                          )}
                          {status === "closed" && (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                              Closed
                            </span>
                          )}
                          {status === "manually_closed" && (
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                              Manually Closed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">
                          Attendees: {event.attendee_count}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/attendees`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          View Attendees
                        </Link>
                        <button
                          onClick={() =>
                            handleToggleClosed(event.id, event.is_closed)
                          }
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          {event.is_closed ? "Reopen" : "Close Registration"}
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div>
                      <QRCodeDisplay
                        eventId={event.id}
                        eventTitle={event.title}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
