"use client";

import { useState } from "react";
import type { EmailTemplate } from "@/types/email-template";

interface TemplateFormProps {
  template?: EmailTemplate | null;
  subject: string;
  body: string;
  isHtml: boolean;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function TemplateForm({
  template,
  subject,
  body,
  isHtml,
  onSave,
  onCancel,
}: TemplateFormProps) {
  const [name, setName] = useState(template?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }

    if (!body.trim()) {
      setError("Email body is required");
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">
          {template ? "Update Template" : "Save as Template"}
        </h3>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Email, Follow-up"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="text-gray-600">
              <strong>Subject:</strong> {subject || "(empty)"}
            </div>
            <div className="text-gray-600 mt-1">
              <strong>Format:</strong> {isHtml ? "HTML" : "Plain text"}
            </div>
            <div className="text-gray-600 mt-1">
              <strong>Body:</strong>{" "}
              {body
                ? `${body.substring(0, 100)}${body.length > 100 ? "..." : ""}`
                : "(empty)"}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? "Saving..." : template ? "Update" : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
