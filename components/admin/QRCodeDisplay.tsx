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


  return (
    <>
      <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Use the rotating QR code for in-person check-in.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Show Rotating QR
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Rotating QR Code
                </h2>
                <p className="text-sm text-gray-600">{eventTitle}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {error && (
                <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="w-72 h-72 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                {loadingToken && !eventUrl ? (
                  <div className="text-gray-500 text-sm">Loading QR...</div>
                ) : eventUrl ? (
                  <QRCodeCanvas
                    value={eventUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="text-gray-500 text-sm">
                    QR code unavailable
                  </div>
                )}
              </div>

              <div className="text-center">
                {secondsLeft !== null && (
                  <p className="text-xs text-gray-500">
                    Expires in {secondsLeft}s
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
