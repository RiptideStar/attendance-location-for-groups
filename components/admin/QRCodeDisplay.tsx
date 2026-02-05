"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

interface QRCodeDisplayProps {
  eventId: string;
  eventTitle: string;
}

export function QRCodeDisplay({ eventId, eventTitle }: QRCodeDisplayProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const eventUrl = useMemo(() => {
    if (!token) return "";
    return `${baseUrl}/event/${eventId}?qr=${token}`;
  }, [baseUrl, eventId, token]);

  useEffect(() => {
    if (!showModal) return;

    let canceled = false;
    const fetchToken = async () => {
      try {
        setLoadingToken(true);
        setError("");
        const response = await fetch(`/api/events/${eventId}/qr-token`);
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Failed to fetch QR token");
        }
        const data = await response.json();
        if (canceled) return;
        setToken(data.token);
        setExpiresAt(data.expiresAt);
      } catch (err) {
        if (!canceled) {
          setError(err instanceof Error ? err.message : "Failed to fetch QR code");
        }
      } finally {
        if (!canceled) {
          setLoadingToken(false);
        }
      }
    };

    fetchToken();
    const refreshInterval = setInterval(fetchToken, 3000);
    return () => {
      canceled = true;
      clearInterval(refreshInterval);
    };
  }, [eventId, showModal]);

  useEffect(() => {
    if (!showModal) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [showModal]);

  const secondsLeft = useMemo(() => {
    if (!expiresAt) return null;
    const remainingMs = expiresAt - now;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }, [expiresAt, now]);

  const progressPercent = useMemo(() => {
    if (secondsLeft === null) return 100;
    return (secondsLeft / 3) * 100;
  }, [secondsLeft]);

  return (
    <>
      <div className="card p-5 text-center">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Display rotating QR for check-in
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary w-full text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Show QR Code
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Rotating QR Code</h2>
                <p className="text-sm text-gray-600 truncate max-w-[250px]">{eventTitle}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              {error && (
                <div className="w-full alert alert-error mb-4">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <div className="w-64 h-64 flex items-center justify-center bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
                  {loadingToken && !eventUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Generating...</span>
                    </div>
                  ) : eventUrl ? (
                    <QRCodeCanvas
                      value={eventUrl}
                      size={224}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="text-gray-500 text-sm text-center px-4">
                      QR code unavailable
                    </div>
                  )}
                </div>

                {/* Progress indicator */}
                {secondsLeft !== null && eventUrl && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Code refreshes automatically
                </p>
                {secondsLeft !== null && (
                  <p className="text-xs text-gray-400">
                    Next refresh in {secondsLeft}s
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Display on a screen for attendees to scan
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
