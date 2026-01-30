"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { utcToLocalInput } from "@/lib/utils/date-helpers";
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
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    startTime: initialData?.start_time
      ? utcToLocalInput(initialData.start_time)
      : "",
    endTime: initialData?.end_time ? utcToLocalInput(initialData.end_time) : "",
    locationAddress: initialData?.location_address || "",
    locationLat: initialData?.location_lat || 39.9526, // Default to Philly
    locationLng: initialData?.location_lng || -75.1652,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
            Start Time (ET) <span className="text-red-500">*</span>
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
            End Time (ET) <span className="text-red-500">*</span>
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
