"use client";

import type { EmailBlastPreview } from "@/types/email";

interface EmailPreviewProps {
  preview: EmailBlastPreview;
  subject: string;
  body: string;
  isHtml: boolean;
  sending: boolean;
  onBack: () => void;
  onSend: () => void;
}

export function EmailPreview({
  preview,
  subject,
  body,
  isHtml,
  sending,
  onBack,
  onSend,
}: EmailPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Recipient Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Recipient Summary</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {preview.recipientCount}
            </div>
            <div className="text-sm text-gray-600">Unique Recipients</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
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
                  className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600"
                >
                  {r.name} ({r.email})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rate limit warning */}
        {preview.recipientCount > 80 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Warning: You are approaching the free tier limit of 100 emails/day.
            Current batch: {preview.recipientCount} recipients.
          </div>
        )}
      </div>

      {/* Email Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Email Preview</h2>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="text-sm">
              <span className="font-medium">Subject:</span> {subject}
            </div>
          </div>
          <div className="p-4">
            {isHtml ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {body}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={sending}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onSend}
          disabled={sending}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
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
