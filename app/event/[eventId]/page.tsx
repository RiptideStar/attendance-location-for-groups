"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  | "qr_required"
  | "location_verification"
  | "check_in_form"
  | "success"
  | "error"
  | "closed"
  | "already_checked_in";

export default function EventCheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const searchParams = useSearchParams();
  const qrToken = searchParams.get("qr") || "";

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
  }, [event, qrToken]);

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
      if (!qrToken) {
        setFlowState("qr_required");
      } else {
        setFlowState("location_verification");
      }
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
      if (!qrToken) {
        throw new Error("QR code is required. Please scan the event QR code.");
      }

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
          qrToken,
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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-radial opacity-40 pointer-events-none" />

      <div className="relative max-w-lg w-full">
        {/* Loading */}
        {flowState === "loading" && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading event...</p>
          </div>
        )}

        {/* Not Found */}
        {flowState === "not_found" && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600">
              This event doesn&apos;t exist or has been deleted.
            </p>
          </div>
        )}

        {event && (
          <>
            {/* Event Header */}
            <div className="mb-6 text-center animate-fade-in-down">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 mb-4">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <div className="flex flex-col items-center gap-1 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {formatDate(event.start_time, { dateStyle: "medium", timeStyle: "short" }, event.timezone)} - {formatDate(event.end_time, { timeStyle: "short" }, event.timezone)}
                  </span>
                  <span className="text-gray-400">({getTimezoneAbbreviation(event.timezone)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location_address}</span>
                </div>
              </div>
            </div>

            {/* Countdown */}
            {flowState === "countdown" && (
              <div className="animate-fade-in-up">
                <CountdownTimer
                  targetTime={
                    new Date(
                      new Date(event.start_time).getTime() -
                        event.registration_window_before_minutes * 60 * 1000
                    )
                  }
                  onComplete={handleCountdownComplete}
                />
              </div>
            )}

            {/* QR Required */}
            {flowState === "qr_required" && (
              <div className="card p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
                <p className="text-gray-600">
                  Scan the rotating QR code displayed at the event to begin check-in.
                </p>
              </div>
            )}

            {/* Closed */}
            {flowState === "closed" && (
              <div className="card p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Closed</h2>
                <p className="text-gray-600">
                  Check-in is no longer available for this event.
                </p>
              </div>
            )}

            {/* Already Checked In */}
            {flowState === "already_checked_in" && (
              <div className="card p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Already Checked In</h2>
                <p className="text-gray-600">
                  You&apos;ve already checked in to this event.
                </p>
              </div>
            )}

            {/* Location Verification */}
            {flowState === "location_verification" && (
              <div className="animate-fade-in-up">
                <LocationVerification
                  eventCoords={{
                    lat: event.location_lat,
                    lng: event.location_lng,
                  }}
                  radiusMeters={event.location_radius_meters}
                  onVerified={handleLocationVerified}
                  onError={handleLocationError}
                />
              </div>
            )}

            {/* Check-in Form */}
            {flowState === "check_in_form" && (
              <div className="card p-8 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Location Verified</h2>
                    <p className="text-sm text-gray-600">Complete your check-in below</p>
                  </div>
                </div>
                <CheckInForm onSubmit={handleCheckInSubmit} loading={submitting} />
              </div>
            )}

            {/* Success */}
            {flowState === "success" && (
              <div className="card p-8 text-center animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Checked In!</h2>
                <p className="text-gray-600">
                  Your attendance has been recorded successfully.
                </p>
              </div>
            )}

            {/* Error */}
            {flowState === "error" && (
              <div className="card p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check-In Failed</h2>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
                <button
                  onClick={() =>
                    setFlowState(qrToken ? "location_verification" : "qr_required")
                  }
                  className="btn btn-primary"
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
