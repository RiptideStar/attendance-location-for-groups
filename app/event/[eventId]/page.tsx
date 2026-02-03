"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CountdownTimer } from "@/components/event/CountdownTimer";
import { LocationVerification } from "@/components/event/LocationVerification";
import { CheckInForm } from "@/components/event/CheckInForm";
import { formatDate, getRegistrationStatus, getTimezoneAbbreviation } from "@/lib/utils/date-helpers";
import { hasAttendedClient } from "@/lib/cookies/attendance-cookie";
import type { Event } from "@/types/event";
import type { CheckInFormData, CheckInResponse } from "@/types/attendance";
import type { Coordinates } from "@/lib/geolocation/verification";

type FlowState =
  | "loading"
  | "not_found"
  | "countdown"
  | "location_verification"
  | "check_in_form"
  | "success"
  | "error"
  | "closed"
  | "already_checked_in";

export default function EventCheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      checkStatus();
    }
  }, [event]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/public/events/${eventId}`);

      if (!response.ok) {
        setFlowState("not_found");
        return;
      }

      const data = await response.json();
      setEvent(data);
    } catch {
      setFlowState("not_found");
    }
  };

  const checkStatus = () => {
    if (!event) return;

    // Check cookie first
    if (hasAttendedClient(eventId)) {
      setFlowState("already_checked_in");
      return;
    }

    const status = getRegistrationStatus(
      event.start_time,
      event.end_time,
      event.registration_window_before_minutes,
      event.registration_window_after_minutes,
      event.is_closed
    );

    if (status === "manually_closed" || status === "closed") {
      setFlowState("closed");
    } else if (status === "not_started") {
      setFlowState("countdown");
    } else {
      // Registration is open
      setFlowState("location_verification");
    }
  };

  const handleCountdownComplete = () => {
    checkStatus();
  };

  const handleLocationVerified = (coords: Coordinates) => {
    setUserCoords(coords);
    setFlowState("check_in_form");
  };

  const handleLocationError = (error: string) => {
    setErrorMessage(error);
    setFlowState("error");
  };

  const handleCheckInSubmit = async (formData: CheckInFormData) => {
    if (!userCoords || !event) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          name: formData.name,
          email: formData.email,
          lat: userCoords.lat,
          lng: userCoords.lng,
        }),
      });

      const data: CheckInResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("error" in data ? data.error : "Failed to check in");
      }

      setFlowState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
      setFlowState("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {flowState === "loading" && (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading event...</p>
          </div>
        )}

        {flowState === "not_found" && (
          <div className="text-center py-12 bg-white rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Event Not Found
            </h2>
            <p className="text-gray-600">
              This event does not exist or has been deleted.
            </p>
          </div>
        )}

        {event && (
          <>
            {/* Event Header */}
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <p className="text-gray-600">
                {formatDate(event.start_time, { dateStyle: "medium", timeStyle: "short" }, event.timezone)} - {formatDate(event.end_time, { timeStyle: "short" }, event.timezone)} ({getTimezoneAbbreviation(event.timezone)})
              </p>
              <p className="text-gray-600 mt-1">{event.location_address}</p>
            </div>

            {flowState === "countdown" && (
              <CountdownTimer
                targetTime={
                  new Date(
                    new Date(event.start_time).getTime() -
                      event.registration_window_before_minutes * 60 * 1000
                  )
                }
                onComplete={handleCountdownComplete}
              />
            )}

            {flowState === "closed" && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Registration Closed
                </h2>
                <p className="text-gray-600">
                  Check-in is no longer available for this event.
                </p>
              </div>
            )}

            {flowState === "already_checked_in" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Already Checked In
                </h2>
                <p className="text-gray-600">
                  You&apos;ve already checked in to this event!
                </p>
              </div>
            )}

            {flowState === "location_verification" && (
              <LocationVerification
                eventCoords={{
                  lat: event.location_lat,
                  lng: event.location_lng,
                }}
                radiusMeters={event.location_radius_meters}
                onVerified={handleLocationVerified}
                onError={handleLocationError}
              />
            )}

            {flowState === "check_in_form" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Complete Your Check-In
                </h2>
                <CheckInForm onSubmit={handleCheckInSubmit} loading={submitting} />
              </div>
            )}

            {flowState === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Check-In Successful!
                </h2>
                <p className="text-gray-600">
                  You&apos;ve been successfully checked in to this event.
                </p>
              </div>
            )}

            {flowState === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Check-In Failed
                </h2>
                <p className="text-gray-600 mb-4">{errorMessage}</p>
                <button
                  onClick={() => setFlowState("location_verification")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
