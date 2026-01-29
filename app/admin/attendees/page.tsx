"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AttendeeTable } from "@/components/admin/AttendeeTable";
import type { AttendeeWithEvent } from "@/types/attendance";

export default function AllAttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAttendees();
  }, []);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/attendees");

      if (!response.ok) {
        throw new Error("Failed to fetch attendees");
      }

      const data = await response.json();
      setAttendees(data);
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
          <h1 className="text-2xl font-bold text-gray-900">
            Penn CBC Attendance - Admin
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <Link
              href="/admin"
              className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              Events
            </Link>
            <Link
              href="/admin/attendees"
              className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              All Attendees
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            All Attendees
          </h2>
          <p className="text-gray-600">
            Search and filter all attendees across all events
          </p>
        </div>

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

        {!loading && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <AttendeeTable attendees={attendees} showEventColumn={true} />
          </div>
        )}
      </div>
    </div>
  );
}
