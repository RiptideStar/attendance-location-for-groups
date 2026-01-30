"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecurringEventForm } from "@/components/admin/RecurringEventForm";
import type { RecurringEventFormData } from "@/types/recurring-event";

export default function NewRecurringEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ events_created: number } | null>(
    null
  );

  const handleSubmit = async (data: RecurringEventFormData) => {
    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const response = await fetch("/api/recurring-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          start_time: data.startTime + ":00", // Add seconds
          duration_minutes: data.durationMinutes,
          start_date: data.startDate,
          end_date: data.endDate,
          location_address: data.locationAddress,
          location_lat: data.locationLat,
          location_lng: data.locationLng,
          recurrence_type: data.recurrenceType,
          recurrence_interval: data.recurrenceInterval,
          recurrence_days: data.recurrenceDays.length > 0 ? data.recurrenceDays : null,
          recurrence_monthly_date: data.recurrenceMonthlyDate,
          recurrence_monthly_week: data.recurrenceMonthlyWeek,
          recurrence_monthly_weekday: data.recurrenceMonthlyWeekday,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create recurring event"
        );
      }

      const result = await response.json();
      setSuccess(result);
      setLoading(false);

      // Redirect to admin dashboard after a brief delay
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Recurring Event
          </h1>
          <p className="text-gray-600">
            Set up a recurring event pattern to automatically create multiple
            events
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Successfully created {success.events_created} events! Redirecting...
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <RecurringEventForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  );
}
