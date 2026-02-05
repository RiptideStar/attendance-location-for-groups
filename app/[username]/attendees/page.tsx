"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AttendeeTable } from "@/components/admin/AttendeeTable";
import { AddAttendeeModal } from "@/components/admin/AddAttendeeModal";
import type { AttendeeWithEvent } from "@/types/attendance";

export default function AllAttendeesPage() {
  const { data: session } = useSession();
  const [attendees, setAttendees] = useState<AttendeeWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const username = session?.user?.organizationUsername || "";
  const organizationName = session?.user?.organizationName || "";

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

  const handleDelete = async (ids: string[]) => {
    try {
      setError("");
      const response = await fetch("/api/attendees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete attendees");
      }

      await fetchAttendees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
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
              <h2 className="text-2xl font-bold text-gray-900">All Attendees</h2>
              <p className="text-gray-600 mt-1">
                Search and manage attendees across all events
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Attendee
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Loading attendees...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Attendee Table */}
        {!loading && (
          <div className="card p-6">
            <AttendeeTable
              attendees={attendees}
              showEventColumn={true}
              selectable={true}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>

      <AddAttendeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchAttendees}
      />
    </div>
  );
}
