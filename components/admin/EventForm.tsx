"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { utcToLocalInput, getBrowserTimezone, getTimezoneAbbreviation } from "@/lib/utils/date-helpers";
import type { Event, EventFormData } from "@/types/event";

const LocationPicker = dynamic(
  () => import("./LocationPicker").then((mod) => ({ default: mod.LocationPicker })),
  { ssr: false }
);

interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: EventFormData) => Promise<void>;
  mode: "create" | "edit";
  loading?: boolean;
}

export function EventForm({
  initialData,
  onSubmit,
  mode,
  loading = false,
}: EventFormProps) {
  const browserTimezone = getBrowserTimezone();
  const tzAbbrev = getTimezoneAbbreviation(browserTimezone);

  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    startTime: initialData?.start_time
      ? utcToLocalInput(initialData.start_time)
      : "",
    endTime: initialData?.end_time ? utcToLocalInput(initialData.end_time) : "",
    locationAddress: initialData?.location_address || "",
    locationLat: initialData?.location_lat || 39.9526, // Default to Philly
    locationLng: initialData?.location_lng || -75.1652,
    timezone: browserTimezone,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Luma import state
  const [lumaUrl, setLumaUrl] = useState("");
  const [lumaImporting, setLumaImporting] = useState(false);
  const [lumaError, setLumaError] = useState("");
  const [lumaSuccess, setLumaSuccess] = useState(false);

  const handleLumaImport = async () => {
    if (!lumaUrl.trim()) {
      setLumaError("Please enter a Luma event URL");
      return;
    }

    setLumaImporting(true);
    setLumaError("");
    setLumaSuccess(false);

    try {
      const response = await fetch("/api/import-luma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lumaUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import event");
      }

      const data = await response.json();

      let resolvedLat: number | null = data.latitude;
      let resolvedLng: number | null = data.longitude;

      // If Luma didn't provide coordinates but gave us an address,
      // try to match against saved organization locations
      if (resolvedLat == null && resolvedLng == null && data.locationAddress) {
        try {
          const locRes = await fetch("/api/locations");
          if (locRes.ok) {
            const savedLocations = await locRes.json();
            if (Array.isArray(savedLocations) && savedLocations.length > 0) {
              const lumaAddr = data.locationAddress.toLowerCase();
              // Try exact substring match first, then fuzzy word overlap
              const match = savedLocations.find(
                (loc: { label: string; address: string }) =>
                  lumaAddr.includes(loc.label.toLowerCase()) ||
                  lumaAddr.includes(loc.address.toLowerCase()) ||
                  loc.label.toLowerCase().includes(lumaAddr) ||
                  loc.address.toLowerCase().includes(lumaAddr)
              ) ?? savedLocations.find(
                (loc: { label: string; address: string }) => {
                  const lumaWords = lumaAddr.split(/[\s,]+/).filter((w: string) => w.length > 2);
                  const locWords = `${loc.label} ${loc.address}`.toLowerCase().split(/[\s,]+/);
                  const overlap = lumaWords.filter((w: string) => locWords.includes(w));
                  return overlap.length >= 2;
                }
              );
              if (match) {
                resolvedLat = match.lat;
                resolvedLng = match.lng;
              }
            }
          }
        } catch {
          // Location matching is best-effort
        }
      }

      setFormData({
        title: data.title || formData.title,
        startTime: data.startTime ? utcToLocalInput(data.startTime) : formData.startTime,
        endTime: data.endTime ? utcToLocalInput(data.endTime) : formData.endTime,
        locationAddress: data.locationAddress || formData.locationAddress,
        locationLat: resolvedLat ?? formData.locationLat,
        locationLng: resolvedLng ?? formData.locationLng,
        timezone: data.timezone || browserTimezone,
      });

      setLumaSuccess(true);
      setErrors({});
    } catch (err) {
      setLumaError(err instanceof Error ? err.message : "Failed to import event");
    } finally {
      setLumaImporting(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (end <= start) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    if (!formData.locationAddress.trim()) {
      newErrors.locationAddress = "Location address is required";
    }

    if (formData.locationLat < -90 || formData.locationLat > 90) {
      newErrors.locationLat = "Invalid latitude";
    }

    if (formData.locationLng < -180 || formData.locationLng > 180) {
      newErrors.locationLng = "Invalid longitude";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Luma Import - only show in create mode */}
      {mode === "create" && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-purple-800 mb-2">
            Import from Luma
          </label>
          <p className="text-sm text-purple-600 mb-3">
            Paste a lu.ma event link to auto-fill all fields
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={lumaUrl}
              onChange={(e) => {
                setLumaUrl(e.target.value);
                setLumaError("");
                setLumaSuccess(false);
              }}
              className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://lu.ma/your-event"
              disabled={lumaImporting || loading}
            />
            <button
              type="button"
              onClick={handleLumaImport}
              disabled={lumaImporting || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {lumaImporting ? "Importing..." : "Import"}
            </button>
          </div>
          {lumaError && (
            <p className="text-red-600 text-sm mt-2">{lumaError}</p>
          )}
          {lumaSuccess && (
            <p className="text-green-600 text-sm mt-2">
              Event imported successfully! Review the details below.
            </p>
          )}
        </div>
      )}

      {/* Event Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="e.g., Weekly General Body Meeting"
          disabled={loading}
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      {/* Start and End Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Start Time ({tzAbbrev}) <span className="text-red-500">*</span>
          </label>
          <input
            id="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.startTime ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors.startTime && (
            <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            End Time ({tzAbbrev}) <span className="text-red-500">*</span>
          </label>
          <input
            id="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.endTime ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors.endTime && (
            <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>
          )}
        </div>

      </div>

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Location <span className="text-red-500">*</span>
        </label>
        <LocationPicker
          address={formData.locationAddress}
          lat={formData.locationLat}
          lng={formData.locationLng}
          onChange={(address, lat, lng) =>
            setFormData({
              ...formData,
              locationAddress: address,
              locationLat: lat,
              locationLng: lng,
            })
          }
        />
        {errors.locationAddress && (
          <p className="text-red-600 text-sm mt-1">{errors.locationAddress}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
            ? "Create Event"
            : "Update Event"}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Registration will open 30 minutes before start time and close 30 minutes
        after end time. Users must be within 50 meters of the location.
      </p>
    </form>
  );
}
