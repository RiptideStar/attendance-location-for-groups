"use client";

import { useState } from "react";
import type { EmailTemplateWithStats } from "@/types/email-template";

interface TemplateListProps {
  templates: EmailTemplateWithStats[];
  loading: boolean;
  onSend: (template: EmailTemplateWithStats) => void;
  onEdit: (template: EmailTemplateWithStats) => void;
  onDelete: (template: EmailTemplateWithStats) => void;
  onLoad: (template: EmailTemplateWithStats) => void;
}

export function TemplateList({
  templates,
  loading,
  onSend,
  onEdit,
  onDelete,
  onLoad,
}: TemplateListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (template: EmailTemplateWithStats) => {
    if (
      !confirm(
        `Are you sure you want to delete the template "${template.name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(template.id);
    try {
      await onDelete(template);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading templates...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-2">No templates yet</p>
        <p className="text-sm text-gray-500">
          Create your first template using the &ldquo;Compose&rdquo; tab
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 truncate mt-1">
                Subject: {template.subject}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>{template.total_sent} sent</span>
                <span>
                  {template.is_html ? "HTML" : "Plain text"}
                </span>
                <span>
                  Updated{" "}
                  {new Date(template.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onLoad(template)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                title="Load into composer"
              >
                Load
              </button>
              <button
                onClick={() => onEdit(template)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Edit
              </button>
              <button
                onClick={() => onSend(template)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Send to New
              </button>
              <button
                onClick={() => handleDelete(template)}
                disabled={deletingId === template.id}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                {deletingId === template.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
