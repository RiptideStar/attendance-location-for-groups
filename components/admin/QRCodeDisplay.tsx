"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  eventId: string;
  eventTitle: string;
}

export function QRCodeDisplay({ eventId, eventTitle }: QRCodeDisplayProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/event/${eventId}`;

  const downloadQR = () => {
    // Get the SVG element
    const svg = document.querySelector(`#qr-${eventId}`) as SVGSVGElement;
    if (!svg) return;

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (larger for better quality)
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    // Create an image from the SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Draw the image
      ctx.drawImage(img, 0, 0, size, size);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `qr-code-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <QRCodeSVG
        id={`qr-${eventId}`}
        value={eventUrl}
        size={200}
        level="H"
        includeMargin={true}
        className="border-4 border-white shadow-sm"
      />

      <div className="text-center">
        <p className="text-sm font-mono text-gray-600 break-all max-w-xs">
          {eventUrl}
        </p>
      </div>

      <button
        onClick={downloadQR}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Download QR Code
      </button>
    </div>
  );
}
