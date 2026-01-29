"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AttendeeTable } from "@/components/admin/AttendeeTable";
import type { Event } from "@/types/event";
import type { AttendeeWithEvent } from "@/types/attendance";

export default function EventAttendeesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<AttendeeWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}`);
      if (!eventResponse.ok) {
        throw new Error("Event not found");
      }
      const eventData = await eventResponse.json();
      setEvent(eventData);

      // Fetch attendees for this event
      const attendeesResponse = await fetch(
        `/api/attendees?event_id=${eventId}`
      );
      if (!attendeesResponse.ok) {
        throw new Error("Failed to fetch attendees");
      }
      const attendeesData = await attendeesResponse.json();
      setAttendees(attendeesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading attendees...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && event && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <p className="text-gray-600">
                Attendees for this event ({attendees.length} total)
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <AttendeeTable attendees={attendees} showEventColumn={false} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
