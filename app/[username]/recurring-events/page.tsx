"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import type { RecurringEventWithCount } from "@/types/recurring-event";
import { DAYS_OF_WEEK, WEEK_ORDINALS } from "@/types/recurring-event";

export default function RecurringEventsPage() {
  const { data: session } = useSession();
  const [recurringEvents, setRecurringEvents] = useState<RecurringEventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username = session?.user?.organizationUsername || "";
  const organizationName = session?.user?.organizationName || "";

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
      <AdminNav username={username} organizationName={organizationName} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recurring Events</h2>
              <p className="text-gray-600 mt-1">Automatically generate events on a schedule</p>
            </div>
            <Link
              href={`/${username}/recurring-events/new`}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Recurring Event
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading recurring events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && recurringEvents.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recurring events</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Create a recurring event to automatically generate events on a schedule
            </p>
            <Link
              href={`/${username}/recurring-events/new`}
              className="btn btn-primary"
            >
              Create Your First Recurring Event
            </Link>
          </div>
        )}

        {/* Events List */}
        {!loading && !error && recurringEvents.length > 0 && (
          <div className="space-y-4">
            {recurringEvents.map((event, index) => (
              <div
                key={event.id}
                className="card p-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{formatRecurrencePattern(event)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{event.start_time} ({event.duration_minutes} min)</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              Started {new Date(event.start_date).toLocaleDateString()}
                              {event.end_date && ` - ends ${new Date(event.end_date).toLocaleDateString()}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{event.location_address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                    <div className="text-center lg:text-right">
                      <div className="text-2xl font-bold text-indigo-600">{event.event_count}</div>
                      <div className="text-xs text-gray-500">Events Created</div>
                    </div>
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      className="btn btn-danger text-sm py-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
