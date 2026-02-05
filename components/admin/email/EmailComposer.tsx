"use client";

import { useRef, useState } from "react";
import type { EmailAttachment } from "@/types/email";

// 10MB max per file, 25MB total
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

interface EmailComposerProps {
  subject: string;
  body: string;
  isHtml: boolean;
  attachments: EmailAttachment[];
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
  onIsHtmlChange: (isHtml: boolean) => void;
  onAttachmentsChange: (attachments: EmailAttachment[]) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
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

export function EmailComposer({
  subject,
  body,
  isHtml,
  attachments,
  onSubjectChange,
  onBodyChange,
  onIsHtmlChange,
  onAttachmentsChange,
  onBack,
  onNext,
  loading = false,
}: EmailComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isValid = subject.trim().length > 0 && body.trim().length > 0;

  // Link insertion state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const totalAttachmentSize = attachments.reduce(
    (sum, att) => sum + Buffer.from(att.content, "base64").length,
    0
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: EmailAttachment[] = [];
    let currentTotal = totalAttachmentSize;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB per file.`);
        continue;
      }

      if (currentTotal + file.size > MAX_TOTAL_SIZE) {
        alert(`Cannot add "${file.name}". Total attachment size would exceed 25MB.`);
        continue;
      }

      // Check for duplicate filenames
      if (attachments.some((att) => att.filename === file.name)) {
        alert(`File "${file.name}" is already attached.`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          filename: file.name,
          content: base64,
          contentType: file.type || "application/octet-stream",
        });
        currentTotal += file.size;
      } catch {
        alert(`Failed to read file "${file.name}".`);
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (filename: string) => {
    onAttachmentsChange(attachments.filter((att) => att.filename !== filename));
  };

  const normalizeLinkUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";

    // Fix common paste error: "https://https://example.com"
    const doubleScheme = trimmed.match(/^(https?:\/\/)(https?:\/\/.+)$/i);
    if (doubleScheme) {
      return doubleScheme[2];
    }

    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;

    const url = normalizeLinkUrl(linkUrl);

    // Insert as markdown-style link when link text is provided.
    // Plain URLs remain for auto-linking.
    const linkMarkup = linkText.trim()
      ? `[${linkText.trim()}](${url})`
      : url;

    // Insert at cursor position or append
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + linkMarkup + body.substring(end);
      onBodyChange(newBody);

      // Reset and close modal
      setLinkText("");
      setLinkUrl("");
      setShowLinkModal(false);

      // Focus textarea and set cursor after inserted link
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + linkMarkup.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Fallback: append to body
      onBodyChange(body + linkMarkup);
      setLinkText("");
      setLinkUrl("");
      setShowLinkModal(false);
    }
  };

  const handleOpenLinkModal = () => {
    // Check if there's selected text to use as link text
    const textarea = textareaRef.current;
    if (textarea) {
      const selectedText = body.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selectedText) {
        setLinkText(selectedText);
      }
    }
    setShowLinkModal(true);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Email</h2>

      <div className="space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Enter email subject..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Message Body <span className="text-red-500">*</span>
          </label>

          {/* Toolbar */}
          <div className="flex items-center gap-1 mb-1.5 p-1.5 bg-gray-50 border border-gray-200 rounded-t-lg border-b-0">
            <button
              type="button"
              onClick={handleOpenLinkModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Insert link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Insert Link
            </button>
            <span className="text-xs text-gray-400 ml-2">Links will be clickable in the email</span>
          </div>

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder="Enter your email message here...

You can insert links using the button above - they'll be clickable in the email."
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-b-lg rounded-t-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Attachments
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attachment list */}
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((att) => {
                const size = Buffer.from(att.content, "base64").length;
                return (
                  <div
                    key={att.filename}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{getFileIcon(att.contentType)}</span>
                      <span className="text-sm text-gray-700 truncate">{att.filename}</span>
                      <span className="text-xs text-gray-500">({formatFileSize(size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.filename)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove attachment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500">
                Total: {formatFileSize(totalAttachmentSize)} / 25 MB
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Add Attachments
          </button>
          <p className="mt-1.5 text-xs text-gray-500">
            Max 10MB per file, 25MB total
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <button
            onClick={onBack}
            className="btn btn-secondary"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!isValid || loading}
            className="btn btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              "Preview Email"
            )}
          </button>
        </div>
      </div>

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowLinkModal(false);
              setLinkText("");
              setLinkUrl("");
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert Link</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Display text (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to show the URL as the link text
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && linkUrl.trim()) {
                      handleInsertLink();
                    }
                  }}
                />
              </div>

              {linkUrl && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Will insert:</p>
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {linkText.trim()
                      ? `[${linkText.trim()}](${normalizeLinkUrl(linkUrl)})`
                      : normalizeLinkUrl(linkUrl)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkText("");
                  setLinkUrl("");
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl.trim()}
                className="btn btn-primary"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
