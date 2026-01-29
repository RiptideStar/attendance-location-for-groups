"use client";

import { useState } from "react";
import type { CheckInFormData } from "@/types/attendance";

interface CheckInFormProps {
  onSubmit: (data: CheckInFormData) => Promise<void>;
  loading?: boolean;
}

export function CheckInForm({ onSubmit, loading = false }: CheckInFormProps) {
  const [formData, setFormData] = useState<CheckInFormData>({
    name: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
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
      // Error handling done by parent component
      console.error("Error submitting check-in:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter your full name"
          disabled={loading}
          autoComplete="name"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="your.email@example.com"
          disabled={loading}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Checking In..." : "Check In"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        By checking in, you confirm your attendance at this event
      </p>
    </form>
  );
}
