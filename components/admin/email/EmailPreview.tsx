"use client";

import React from "react";
import type { EmailAttachment, EmailBlastPreview } from "@/types/email";

interface EmailPreviewProps {
  preview: EmailBlastPreview;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  sending: boolean;
  onBack: () => void;
  onSend: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType === "application/pdf") return "📄";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "📊";
  if (contentType.includes("document") || contentType.includes("word")) return "📝";
  if (contentType.includes("zip") || contentType.includes("compressed")) return "📦";
  return "📎";
}

// Convert URLs in text to clickable links for preview
function renderBodyWithLinks(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function EmailPreview({
  preview,
  subject,
  body,
  attachments = [],
  sending,
  onBack,
  onSend,
}: EmailPreviewProps) {
  const totalAttachmentSize = attachments.reduce(
    (sum, att) => sum + Buffer.from(att.content, "base64").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Recipient Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient Summary</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <div className="text-2xl font-bold text-indigo-600">
              {preview.recipientCount}
            </div>
            <div className="text-sm text-gray-600">Unique Recipients</div>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-gray-600">
              {preview.totalEvents}
            </div>
            <div className="text-sm text-gray-600">Events Included</div>
          </div>
        </div>

        {preview.eventTitles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Events:</h4>
            <div className="text-sm text-gray-600">
              {preview.eventTitles.join(", ")}
              {preview.totalEvents > 5 &&
                ` and ${preview.totalEvents - 5} more...`}
            </div>
          </div>
        )}

        {preview.recipients.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Sample Recipients (first 10):
            </h4>
            <div className="flex flex-wrap gap-2">
              {preview.recipients.map((r, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-100 rounded-lg text-sm text-gray-600"
                >
                  {r.name} ({r.email})
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Email Preview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h2>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="text-sm">
              <span className="font-medium">Subject:</span> {subject}
            </div>
          </div>
          <div className="p-4">
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {renderBodyWithLinks(body)}
            </div>
          </div>

          {/* Attachments section */}
          {attachments.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Attachments ({attachments.length})
              </h4>
              <div className="space-y-1">
                {attachments.map((att) => {
                  const size = Buffer.from(att.content, "base64").length;
                  return (
                    <div
                      key={att.filename}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <span>{getFileIcon(att.contentType)}</span>
                      <span>{att.filename}</span>
                      <span className="text-gray-400">({formatFileSize(size)})</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total attachment size: {formatFileSize(totalAttachmentSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          disabled={sending}
          className="btn btn-secondary"
        >
          Back
        </button>
        <button
          onClick={onSend}
          disabled={sending}
          className="btn btn-success flex items-center gap-2"
        >
          {sending ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            `Send to ${preview.recipientCount} Recipients`
          )}
        </button>
      </div>
    </div>
  );
}
