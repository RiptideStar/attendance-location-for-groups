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

function detectPlatform(): "ios" | "mac-safari" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return "mac-safari";
  return "other";
}

function LocationSettingsPopup({ onClose, onRetry }: { onClose: () => void; onRetry: () => void }) {
  const platform = detectPlatform();

  const instructions: { title: string; steps: string[] }[] = (() => {
    switch (platform) {
      case "ios":
        return [
          {
            title: "Enable Location Services on your device",
            steps: [
              "Open the Settings app on your iPhone/iPad",
              "Tap Privacy & Security → Location Services",
              "Make sure Location Services is turned ON",
            ],
          },
          {
            title: "Allow Safari to use your location",
            steps: [
              "In Settings, scroll down and tap Safari",
              "Tap Location (under Settings for Websites)",
              "Select Ask or Allow",
            ],
          },
        ];
      case "mac-safari":
        return [
          {
            title: "Enable location in Safari",
            steps: [
              "Click Safari in the menu bar → Settings (or Preferences)",
              "Go to the Websites tab → Location",
              "Find this website and set it to Ask or Allow",
            ],
          },
          {
            title: "Enable Location Services on your Mac",
            steps: [
              "Open System Settings → Privacy & Security → Location Services",
              "Make sure Location Services is enabled",
              "Check that Safari is listed and enabled",
            ],
          },
        ];
      case "android":
        return [
          {
            title: "Enable location on your device",
            steps: [
              "Open Settings → Location",
              "Make sure Location is turned ON",
            ],
          },
          {
            title: "Allow your browser to use location",
            steps: [
              "Open Settings → Apps → your browser app",
              "Tap Permissions → Location → Allow",
            ],
          },
        ];
      default:
        return [
          {
            title: "Enable location in your browser",
            steps: [
              "Click the lock/info icon in the address bar",
              "Find Location permissions and set to Allow",
              "Refresh the page and try again",
            ],
          },
        ];
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Enable Location Services</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-5">
            Location access is required for check-in. Follow these steps to enable it:
          </p>

          <div className="space-y-5">
            {instructions.map((section, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  {i + 1}. {section.title}
                </h4>
                <ol className="space-y-1.5 ml-4">
                  {section.steps.map((step, j) => (
                    <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-indigo-500 font-medium flex-shrink-0">{String.fromCharCode(97 + j)}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { onClose(); onRetry(); }}
              className="btn btn-primary flex-1 py-2.5"
            >
              I&apos;ve Enabled It — Try Again
            </button>
          </div>

          {platform === "ios" && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              After changing settings, you may need to refresh this page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LocationVerification({
  eventCoords,
  radiusMeters,
  onVerified,
  onError,
}: LocationVerificationProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [isLocationDenied, setIsLocationDenied] = useState(false);

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
        setIsLocationDenied(false);

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
        let denied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission denied. Please enable location access in your browser settings and try again.";
            denied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            message =
              "Location information is unavailable. Please ensure location services are enabled on your device.";
            denied = true;
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }

        setIsLocationDenied(denied);
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLocationDenied && (
              <button
                onClick={() => setShowSettingsPopup(true)}
                className="btn bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                How to Enable Location
              </button>
            )}
            <button
              onClick={requestLocation}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Location Settings Popup */}
      {showSettingsPopup && (
        <LocationSettingsPopup
          onClose={() => setShowSettingsPopup(false)}
          onRetry={requestLocation}
        />
      )}
    </div>
  );
}
