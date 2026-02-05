"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { EventMultiSelect } from "@/components/admin/email/EventMultiSelect";
import { EmailComposer } from "@/components/admin/email/EmailComposer";
import { EmailPreview } from "@/components/admin/email/EmailPreview";
import { TemplateList } from "@/components/admin/email/TemplateList";
import { TemplateForm } from "@/components/admin/email/TemplateForm";
import { VariableHelp } from "@/components/admin/email/VariableHelp";
import type { EventWithCount } from "@/types/event";
import type { EmailBlastPreview, EmailBlastResponse } from "@/types/email";
import type {
  EmailTemplateWithStats,
  TemplateSendResponse,
} from "@/types/email-template";

type Tab = "templates" | "compose";
type Step = "select" | "compose" | "preview" | "sending" | "complete";

export default function EmailBlastPage() {
  const { data: session } = useSession();
  const username = session?.user?.organizationUsername || "";

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("templates");

  // Events
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplateWithStats[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Selection state (for both compose and template send)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Email content (compose tab)
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState(false);

  // Preview & sending
  const [preview, setPreview] = useState<EmailBlastPreview | null>(null);
  const [sendResult, setSendResult] = useState<EmailBlastResponse | TemplateSendResponse | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");

  // Template form modal
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateWithStats | null>(null);

  // Template send mode
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplateWithStats | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/email-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
  }, [fetchEvents, fetchTemplates]);

  // Compose tab handlers
  const handlePreview = async () => {
    setError("");
    setPreviewLoading(true);
    try {
      const response = await fetch("/api/email-blast/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: selectAll ? [] : selectedEventIds,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get preview");
      }

      const data: EmailBlastPreview = await response.json();
      setPreview(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    setError("");
    setStep("sending");

    try {
      const response = await fetch("/api/email-blast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: selectAll ? [] : selectedEventIds,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          subject,
          body,
          isHtml,
        }),
      });

      const data: EmailBlastResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send emails");
      }

      setSendResult(data);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("preview");
    }
  };

  const handleReset = () => {
    setSelectedEventIds([]);
    setSelectAll(false);
    setDateFrom("");
    setDateTo("");
    setSubject("");
    setBody("");
    setIsHtml(false);
    setPreview(null);
    setSendResult(null);
    setStep("select");
    setSendingTemplate(null);
    setError("");
  };

  // Template handlers
  const handleSaveTemplate = async (name: string) => {
    const url = editingTemplate
      ? `/api/email-templates/${editingTemplate.id}`
      : "/api/email-templates";

    const response = await fetch(url, {
      method: editingTemplate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, body, is_html: isHtml }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to save template");
    }

    setShowTemplateForm(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleDeleteTemplate = async (template: EmailTemplateWithStats) => {
    const response = await fetch(`/api/email-templates/${template.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete template");
    }

    fetchTemplates();
  };

  const handleLoadTemplate = (template: EmailTemplateWithStats) => {
    setSubject(template.subject);
    setBody(template.body);
    setIsHtml(template.is_html);
    setActiveTab("compose");
    setStep("select");
  };

  const handleEditTemplate = (template: EmailTemplateWithStats) => {
    setSubject(template.subject);
    setBody(template.body);
    setIsHtml(template.is_html);
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleSendTemplate = (template: EmailTemplateWithStats) => {
    setSendingTemplate(template);
    setStep("select");
  };

  const handleTemplateSend = async () => {
    if (!sendingTemplate) return;

    setError("");
    setStep("sending");

    try {
      const response = await fetch(
        `/api/email-templates/${sendingTemplate.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventIds: selectAll ? [] : selectedEventIds,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          }),
        }
      );

      const data: TemplateSendResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send emails");
      }

      setSendResult(data);
      setStep("complete");
      fetchTemplates(); // Refresh to update sent counts
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("select");
    }
  };

  const stepIndex = ["select", "compose", "preview", "sending", "complete"].indexOf(step);

  // Check if we're in template send mode
  const isTemplateSendMode = sendingTemplate !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.user?.organizationName} - Admin
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <Link
              href={`/${username}/dashboard`}
              className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              Events
            </Link>
            <Link
              href={`/${username}/recurring-events`}
              className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              Recurring Events
            </Link>
            <Link
              href={`/${username}/attendees`}
              className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              All Attendees
            </Link>
            <Link
              href={`/${username}/email-blast`}
              className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              Email Blast
            </Link>
            <Link
              href={`/${username}/settings`}
              className="py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sub-tabs: Templates / Compose */}
        {!isTemplateSendMode && step !== "complete" && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => {
                setActiveTab("templates");
                handleReset();
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "templates"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Saved Templates
            </button>
            <button
              onClick={() => {
                setActiveTab("compose");
                handleReset();
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "compose"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Compose New
            </button>
          </div>
        )}

        {/* Template Send Mode Header */}
        {isTemplateSendMode && step !== "complete" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  Sending Template: {sendingTemplate.name}
                </h3>
                <p className="text-sm text-blue-700">
                  Only attendees who haven&apos;t received this template will get the email
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && !isTemplateSendMode && step !== "complete" && (
          <TemplateList
            templates={templates}
            loading={templatesLoading}
            onSend={handleSendTemplate}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onLoad={handleLoadTemplate}
          />
        )}

        {/* Compose Tab or Template Send Mode */}
        {(activeTab === "compose" || isTemplateSendMode) && step !== "complete" && (
          <>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {(isTemplateSendMode
                  ? ["Select Events", "Send"]
                  : ["Select Events", "Compose Email", "Preview & Send"]
                ).map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        i <= Math.min(stepIndex, isTemplateSendMode ? 1 : 2)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium">{label}</span>
                    {i < (isTemplateSendMode ? 1 : 2) && (
                      <div
                        className={`w-16 h-1 mx-4 ${
                          i < stepIndex ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Event Selection */}
            {step === "select" && (
              <div>
                <EventMultiSelect
                  events={events}
                  loading={eventsLoading}
                  selectedEventIds={selectedEventIds}
                  onSelectionChange={setSelectedEventIds}
                  selectAll={selectAll}
                  onSelectAllChange={setSelectAll}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={setDateFrom}
                  onDateToChange={setDateTo}
                  onNext={
                    isTemplateSendMode
                      ? handleTemplateSend
                      : () => setStep("compose")
                  }
                  nextButtonText={
                    isTemplateSendMode
                      ? "Send to New Attendees"
                      : "Next: Compose Email"
                  }
                />
                {isTemplateSendMode && (
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Click &ldquo;Next&rdquo; to send to new attendees only
                  </p>
                )}
              </div>
            )}

            {/* Compose Step */}
            {step === "compose" && !isTemplateSendMode && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <VariableHelp
                    onInsert={(v) => {
                      // Insert at cursor position in body
                      setBody((prev) => prev + v);
                    }}
                  />
                  <button
                    onClick={() => setShowTemplateForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Save as Template
                  </button>
                </div>
                <EmailComposer
                  subject={subject}
                  body={body}
                  isHtml={isHtml}
                  onSubjectChange={setSubject}
                  onBodyChange={setBody}
                  onIsHtmlChange={setIsHtml}
                  onBack={() => setStep("select")}
                  onNext={handlePreview}
                  loading={previewLoading}
                />
              </div>
            )}

            {/* Preview Step */}
            {(step === "preview" || step === "sending") && preview && !isTemplateSendMode && (
              <EmailPreview
                preview={preview}
                subject={subject}
                body={body}
                isHtml={isHtml}
                sending={step === "sending"}
                onBack={() => setStep("compose")}
                onSend={handleSend}
              />
            )}
          </>
        )}

        {/* Template send sending state */}
        {isTemplateSendMode && step === "sending" && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Sending emails...</p>
          </div>
        )}

        {/* Completion */}
        {step === "complete" && sendResult && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div
              className={`text-center mb-6 ${
                sendResult.success ? "text-green-600" : "text-yellow-600"
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-100">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {sendResult.success
                  ? "Emails Sent Successfully!"
                  : "Emails Sent with Errors"}
              </h3>
              <p>{sendResult.message}</p>
            </div>

            <div className={`grid gap-4 mb-6 ${
              "totalSkipped" in sendResult ? "grid-cols-3" : "grid-cols-2"
            }`}>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sendResult.totalSent}
                </div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              {"totalSkipped" in sendResult && (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {sendResult.totalSkipped}
                  </div>
                  <div className="text-sm text-gray-600">Already Received</div>
                </div>
              )}
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sendResult.totalFailed}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {sendResult.errors && sendResult.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Failed Emails:</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {sendResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      {err.email}: {err.error}
                    </li>
                  ))}
                  {sendResult.errors.length > 10 && (
                    <li className="text-gray-600">
                      ...and {sendResult.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Another Email
            </button>
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <TemplateForm
          template={editingTemplate}
          subject={subject}
          body={body}
          isHtml={isHtml}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowTemplateForm(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
