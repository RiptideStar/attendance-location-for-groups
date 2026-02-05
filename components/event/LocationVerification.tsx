"use client";

import { useState } from "react";
import { calculateDistance } from "@/lib/geolocation/verification";
import type { Coordinates } from "@/lib/geolocation/verification";

interface LocationVerificationProps {
  eventCoords: Coordinates;
  radiusMeters: number;
  onVerified: (coords: Coordinates) => void;
  onError: (error: string) => void;
}

type Status = "idle" | "requesting" | "verifying" | "verified" | "error";

export function LocationVerification({
  eventCoords,
  radiusMeters,
  onVerified,
  onError,
}: LocationVerificationProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const requestLocation = () => {
    setStatus("requesting");
    setErrorMessage("");

    if (!navigator.geolocation) {
      const error = "Geolocation is not supported by your browser";
      setErrorMessage(error);
      setStatus("error");
      onError(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("verifying");

        const userCoords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const distance = calculateDistance(userCoords, eventCoords);

        if (distance <= radiusMeters) {
          setStatus("verified");
          onVerified(userCoords);
        } else {
          const error = `You are too far from the event location. You must be within ${radiusMeters}m to check in.`;
          setErrorMessage(error);
          setStatus("error");
          onError(error);
        }
      },
      (error) => {
        let message = "Failed to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission denied. Please enable location access in your browser settings and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            message =
              "Location information is unavailable. Please ensure location services are enabled on your device.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }

        setErrorMessage(message);
        setStatus("error");
        onError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="card p-8">
      {/* Idle State */}
      {status === "idle" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Your Location</h3>
          <p className="text-gray-600 mb-6 max-w-xs mx-auto">
            We need to confirm you&apos;re at the event location to complete check-in.
          </p>
          <button
            onClick={requestLocation}
            className="btn btn-primary w-full sm:w-auto px-8 py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Enable Location
          </button>
        </div>
      )}

      {/* Requesting State */}
      {status === "requesting" && (
        <div className="text-center py-4">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Requesting Location</h3>
          <p className="text-gray-600">
            Please allow location access when prompted
          </p>
        </div>
      )}

      {/* Verifying State */}
      {status === "verifying" && (
        <div className="text-center py-4">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-indigo-100 animate-pulse-soft" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Location</h3>
          <p className="text-gray-600">
            Checking if you&apos;re at the event...
          </p>
        </div>
      )}

      {/* Verified State */}
      {status === "verified" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Verified</h3>
          <p className="text-gray-600">
            You&apos;re at the event location!
          </p>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
          <p className="text-gray-600 mb-6 max-w-xs mx-auto">{errorMessage}</p>
          <button
            onClick={requestLocation}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
