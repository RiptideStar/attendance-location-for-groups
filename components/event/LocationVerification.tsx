"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    requestLocation();
  }, []);

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

        // Calculate distance
        const distance = calculateDistance(userCoords, eventCoords);

        if (distance <= radiusMeters) {
          setStatus("verified");
          onVerified(userCoords);
        } else {
          const error = `You are too far from the event location to check in. You must be within ${radiusMeters}m.`;
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
            message =
              "Location request timed out. Please try again.";
            break;
        }

        setErrorMessage(message);
        setStatus("error");
        onError(message);
      },
      {
        enableHighAccuracy: true, // Request GPS if available
        timeout: 10000, // 10 second timeout
        maximumAge: 0, // Don't use cached position
      }
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      {status === "requesting" && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Requesting Location Permission
          </h3>
          <p className="text-gray-600">
            Please allow location access when prompted
          </p>
        </div>
      )}

      {status === "verifying" && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verifying Your Location
          </h3>
          <p className="text-gray-600">Checking if you're at the event...</p>
        </div>
      )}

      {status === "verified" && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
            <svg
              className="w-6 h-6 text-green-600"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Location Verified
          </h3>
          <p className="text-gray-600">You're at the event location!</p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg
              className="w-6 h-6 text-red-600"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Location Verification Failed
          </h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={requestLocation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
