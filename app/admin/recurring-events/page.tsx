"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecurringEventWithCount } from "@/types/recurring-event";
import { DAYS_OF_WEEK, WEEK_ORDINALS } from "@/types/recurring-event";

export default function RecurringEventsPage() {
  const [recurringEvents, setRecurringEvents] = useState<
    RecurringEventWithCount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecurringEvents();
  }, []);

  const fetchRecurringEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/recurring-events");

      if (!response.ok) {
        throw new Error("Failed to fetch recurring events");
      }

      const data = await response.json();
      setRecurringEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the recurring event "${title}"? This will also delete all generated event instances.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/recurring-events/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recurring event");
      }

      fetchRecurringEvents();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete recurring event"
      );
    }
  };

  const formatRecurrencePattern = (event: RecurringEventWithCount): string => {
    const interval = event.recurrence_interval;
    const intervalText =
      event.recurrence_type === "weekly"
        ? interval === 1
          ? ""
          : `every ${interval} weeks`
        : interval === 1
        ? ""
        : `every ${interval} months`;

    if (event.recurrence_type === "weekly") {
      const days =
        event.recurrence_days
          ?.map((d) => DAYS_OF_WEEK[d])
          .join(", ") || "";
      return `Weekly ${intervalText} on ${days}`;
    } else if (event.recurrence_type === "monthly_date") {
      return `Monthly ${intervalText} on day ${event.recurrence_monthly_date}`;
    } else if (event.recurrence_type === "monthly_weekday") {
      const week = event.recurrence_monthly_week
        ? WEEK_ORDINALS[event.recurrence_monthly_week - 1]
        : "";
      const day = event.recurrence_monthly_weekday
        ? DAYS_OF_WEEK[event.recurrence_monthly_weekday]
        : "";
      return `Monthly ${intervalText} on ${week} ${day}`;
    }
    return "Unknown pattern";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Recurring Events
          </h1>
          <Link
            href="/admin/recurring-events/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Recurring Event
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading recurring events...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && recurringEvents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No recurring events yet</p>
            <Link
              href="/admin/recurring-events/new"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First Recurring Event
            </Link>
          </div>
        )}

        {!loading && !error && recurringEvents.length > 0 && (
          <div className="grid gap-6">
            {recurringEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Pattern:</span>{" "}
                        {formatRecurrencePattern(event)}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span>{" "}
                        {event.start_time} ({event.duration_minutes} minutes)
                      </p>
                      <p>
                        <span className="font-medium">Start Date:</span>{" "}
                        {new Date(event.start_date).toLocaleDateString()}
                      </p>
                      {event.end_date && (
                        <p>
                          <span className="font-medium">End Date:</span>{" "}
                          {new Date(event.end_date).toLocaleDateString()}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {event.location_address}
                      </p>
                      <p>
                        <span className="font-medium">Events Created:</span>{" "}
                        {event.event_count}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
