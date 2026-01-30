"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";

interface QRCodeDisplayProps {
  eventId: string;
  eventTitle: string;
}

export function QRCodeDisplay({ eventId, eventTitle }: QRCodeDisplayProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/event/${eventId}`;
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [imgCopied, setImgCopied] = useState(false);

  // Convert the hidden canvas to a data URL for an <img> tag
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const canvas = container.querySelector("canvas");
    if (!canvas) return;
    setImgSrc(canvas.toDataURL("image/png"));
  }, [eventId, eventUrl]);

  const getHighResBlob = useCallback((): Promise<Blob | null> => {
    const container = canvasContainerRef.current;
    if (!container) return Promise.resolve(null);
    const sourceCanvas = container.querySelector("canvas");
    if (!sourceCanvas) return Promise.resolve(null);

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(sourceCanvas, 0, 0, size, size);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }, []);

  const downloadQR = async () => {
    const blob = await getHighResBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-code-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyImage = async () => {
    const blob = await getHighResBlob();
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setImgCopied(true);
      setTimeout(() => setImgCopied(false), 2000);
    } catch {
      // Fallback: download instead if clipboard API not supported
      downloadQR();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Hidden canvas used to generate the image */}
      <div ref={canvasContainerRef} className="hidden">
        <QRCodeCanvas
          value={eventUrl}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Rendered as <img> so it's copyable via right-click / long-press */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={`QR code for ${eventTitle}`}
          width={200}
          height={200}
          className="border-4 border-white shadow-sm"
        />
      )}

      <div className="text-center">
        <p className="text-sm font-mono text-gray-600 break-all max-w-xs select-all">
          {eventUrl}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={copyLink}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          {linkCopied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={copyImage}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          {imgCopied ? "Copied!" : "Copy QR"}
        </button>
        <button
          onClick={downloadQR}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Download
        </button>
      </div>
    </div>
  );
}
