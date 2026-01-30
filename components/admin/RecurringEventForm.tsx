"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { RecurringEventFormData } from "@/types/recurring-event";
import { DAYS_OF_WEEK, WEEK_ORDINALS } from "@/types/recurring-event";

const LocationPicker = dynamic(
  () =>
    import("./LocationPicker").then((mod) => ({ default: mod.LocationPicker })),
  { ssr: false }
);

interface RecurringEventFormProps {
  onSubmit: (data: RecurringEventFormData) => Promise<void>;
  loading?: boolean;
}

export function RecurringEventForm({
  onSubmit,
  loading = false,
}: RecurringEventFormProps) {
  const [formData, setFormData] = useState<RecurringEventFormData>({
    title: "",
    startDate: "",
    startTime: "",
    durationMinutes: 60,
    endDate: null,
    locationAddress: "",
    locationLat: 39.9526, // Default to Philly
    locationLng: -75.1652,
    recurrenceType: "weekly",
    recurrenceInterval: 1,
    recurrenceDays: [],
    recurrenceMonthlyDate: null,
    recurrenceMonthlyWeek: null,
    recurrenceMonthlyWeekday: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (formData.durationMinutes <= 0) {
      newErrors.durationMinutes = "Duration must be greater than 0";
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

    // Recurrence validation
    if (formData.recurrenceType === "weekly") {
      if (formData.recurrenceDays.length === 0) {
        newErrors.recurrenceDays = "Select at least one day of the week";
      }
    } else if (formData.recurrenceType === "monthly_date") {
      if (!formData.recurrenceMonthlyDate) {
        newErrors.recurrenceMonthlyDate = "Select a day of the month";
      }
    } else if (formData.recurrenceType === "monthly_weekday") {
      if (!formData.recurrenceMonthlyWeek || !formData.recurrenceMonthlyWeekday) {
        newErrors.recurrenceMonthlyWeekday = "Select week and day";
      }
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

  const toggleDay = (day: number) => {
    setFormData({
      ...formData,
      recurrenceDays: formData.recurrenceDays.includes(day)
        ? formData.recurrenceDays.filter((d) => d !== day)
        : [...formData.recurrenceDays, day].sort(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Event Title
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

      {/* Start Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            First Event Date
          </label>
          <input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.startDate ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors.startDate && (
            <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Start Time (ET)
          </label>
          <input
            id="startTime"
            type="time"
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
            htmlFor="durationMinutes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Duration (minutes)
          </label>
          <input
            id="durationMinutes"
            type="number"
            min="1"
            value={formData.durationMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                durationMinutes: parseInt(e.target.value) || 0,
              })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.durationMinutes ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
          {errors.durationMinutes && (
            <p className="text-red-600 text-sm mt-1">{errors.durationMinutes}</p>
          )}
        </div>
      </div>

      {/* Recurrence Pattern */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recurrence Pattern
        </label>
        <div className="space-y-4">
          {/* Recurrence Type */}
          <div>
            <select
              value={formData.recurrenceType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recurrenceType: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly_date">Monthly (specific date)</option>
              <option value="monthly_weekday">
                Monthly (specific weekday)
              </option>
            </select>
          </div>

          {/* Weekly: Days of week */}
          {formData.recurrenceType === "weekly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repeat on
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.recurrenceDays.includes(index)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={loading}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              {errors.recurrenceDays && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.recurrenceDays}
                </p>
              )}
            </div>
          )}

          {/* Monthly Date */}
          {formData.recurrenceType === "monthly_date" && (
            <div>
              <label
                htmlFor="monthlyDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Day of Month
              </label>
              <input
                id="monthlyDate"
                type="number"
                min="1"
                max="31"
                value={formData.recurrenceMonthlyDate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurrenceMonthlyDate: parseInt(e.target.value) || null,
                  })
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.recurrenceMonthlyDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., 15"
                disabled={loading}
              />
              {errors.recurrenceMonthlyDate && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.recurrenceMonthlyDate}
                </p>
              )}
            </div>
          )}

          {/* Monthly Weekday */}
          {formData.recurrenceType === "monthly_weekday" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="monthlyWeek"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Week of Month
                </label>
                <select
                  id="monthlyWeek"
                  value={formData.recurrenceMonthlyWeek || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrenceMonthlyWeek: parseInt(e.target.value) || null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select...</option>
                  {WEEK_ORDINALS.map((ordinal, index) => (
                    <option key={index} value={index + 1}>
                      {ordinal}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="monthlyWeekday"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Day of Week
                </label>
                <select
                  id="monthlyWeekday"
                  value={
                    formData.recurrenceMonthlyWeekday !== null
                      ? formData.recurrenceMonthlyWeekday
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrenceMonthlyWeekday: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select...</option>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              {errors.recurrenceMonthlyWeekday && (
                <p className="text-red-600 text-sm mt-1 col-span-2">
                  {errors.recurrenceMonthlyWeekday}
                </p>
              )}
            </div>
          )}

          {/* Recurrence Interval */}
          <div>
            <label
              htmlFor="recurrenceInterval"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                id="recurrenceInterval"
                type="number"
                min="1"
                value={formData.recurrenceInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurrenceInterval: parseInt(e.target.value) || 1,
                  })
                }
                className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <span className="text-gray-700">
                {formData.recurrenceType === "weekly"
                  ? formData.recurrenceInterval === 1
                    ? "week"
                    : "weeks"
                  : formData.recurrenceInterval === 1
                  ? "month"
                  : "months"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* End Date */}
      <div>
        <label
          htmlFor="endDate"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          End Date (optional)
        </label>
        <input
          id="endDate"
          type="date"
          value={formData.endDate || ""}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value || null })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">
          Leave blank to create events indefinitely (up to 100 occurrences)
        </p>
      </div>

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Location
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
          {loading ? "Creating..." : "Create Recurring Event"}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        This will create individual events based on the recurrence pattern.
        Registration will open 30 minutes before each event and close 30 minutes
        after. Users must be within 50 meters of the location.
      </p>
    </form>
  );
}
