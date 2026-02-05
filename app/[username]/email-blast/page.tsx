"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AdminNav } from "@/components/admin/AdminNav";
import { EventMultiSelect } from "@/components/admin/email/EventMultiSelect";
import { EmailComposer } from "@/components/admin/email/EmailComposer";
import { EmailPreview } from "@/components/admin/email/EmailPreview";
import { TemplateList } from "@/components/admin/email/TemplateList";
import { TemplateForm } from "@/components/admin/email/TemplateForm";
import { VariableHelp } from "@/components/admin/email/VariableHelp";
import type { EventWithCount } from "@/types/event";
import type { EmailAttachment, EmailBlastPreview, EmailBlastResponse } from "@/types/email";
import type {
  EmailTemplateWithStats,
  TemplateSendResponse,
} from "@/types/email-template";

type Tab = "templates" | "compose";
type Step = "select" | "compose" | "preview" | "sending" | "complete";

export default function EmailBlastPage() {
  const { data: session } = useSession();
  const username = session?.user?.organizationUsername || "";
  const organizationName = session?.user?.organizationName || "";

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
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

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
          attachments: attachments.length > 0 ? attachments : undefined,
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
    setAttachments([]);
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
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("select");
    }
  };

  const stepIndex = ["select", "compose", "preview", "sending", "complete"].indexOf(step);
  const isTemplateSendMode = sendingTemplate !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav username={username} organizationName={organizationName} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Email Blast</h2>
          <p className="text-gray-600 mt-1">Send announcements to your attendees</p>
        </div>

        {/* Sub-tabs: Templates / Compose */}
        {!isTemplateSendMode && step !== "complete" && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => {
                setActiveTab("templates");
                handleReset();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "templates"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Saved Templates
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("compose");
                handleReset();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "compose"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Compose New
              </span>
            </button>
          </div>
        )}

        {/* Template Send Mode Header */}
        {isTemplateSendMode && step !== "complete" && (
          <div className="mb-6 card p-4 border-indigo-200 bg-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-indigo-900">
                    Sending: {sendingTemplate.name}
                  </h3>
                  <p className="text-sm text-indigo-700">
                    Only new attendees will receive this email
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="btn btn-ghost text-indigo-600 hover:text-indigo-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
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
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        i <= Math.min(stepIndex, isTemplateSendMode ? 1 : 2)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {i < stepIndex ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      i <= stepIndex ? "text-gray-900" : "text-gray-500"
                    }`}>{label}</span>
                    {i < (isTemplateSendMode ? 1 : 2) && (
                      <div
                        className={`w-12 sm:w-20 h-1 mx-3 rounded-full transition-colors ${
                          i < stepIndex ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Event Selection */}
            {step === "select" && (
              <div className="card p-6">
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
              </div>
            )}

            {/* Compose Step */}
            {step === "compose" && !isTemplateSendMode && (
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <VariableHelp
                    onInsert={(v) => {
                      setBody((prev) => prev + v);
                    }}
                  />
                  <button
                    onClick={() => setShowTemplateForm(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Save as Template
                  </button>
                </div>
                <EmailComposer
                  subject={subject}
                  body={body}
                  isHtml={isHtml}
                  attachments={attachments}
                  onSubjectChange={setSubject}
                  onBodyChange={setBody}
                  onIsHtmlChange={setIsHtml}
                  onAttachmentsChange={setAttachments}
                  onBack={() => setStep("select")}
                  onNext={handlePreview}
                  loading={previewLoading}
                />
              </div>
            )}

            {/* Preview Step */}
            {(step === "preview" || step === "sending") && preview && !isTemplateSendMode && (
              <div className="card p-6">
                <EmailPreview
                  preview={preview}
                  subject={subject}
                  body={body}
                  attachments={attachments}
                  sending={step === "sending"}
                  onBack={() => setStep("compose")}
                  onSend={handleSend}
                />
              </div>
            )}
          </>
        )}

        {/* Template send sending state */}
        {isTemplateSendMode && step === "sending" && (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Sending emails...</p>
          </div>
        )}

        {/* Completion */}
        {step === "complete" && sendResult && (
          <div className="card p-8 animate-scale-in">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                sendResult.success ? "bg-green-100" : "bg-yellow-100"
              }`}>
                <svg
                  className={`w-8 h-8 ${sendResult.success ? "text-green-600" : "text-yellow-600"}`}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {sendResult.success
                  ? "Emails Sent Successfully!"
                  : "Emails Sent with Errors"}
              </h3>
              <p className="text-gray-600">{sendResult.message}</p>
            </div>

            <div className={`grid gap-4 mb-8 ${
              "totalSkipped" in sendResult ? "grid-cols-3" : "grid-cols-2"
            }`}>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-600">
                  {sendResult.totalSent}
                </div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              {"totalSkipped" in sendResult && (
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-gray-600">
                    {sendResult.totalSkipped}
                  </div>
                  <div className="text-sm text-gray-600">Already Received</div>
                </div>
              )}
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-red-600">
                  {sendResult.totalFailed}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {sendResult.errors && sendResult.errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl">
                <h4 className="font-medium text-red-900 mb-2">Failed Emails:</h4>
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
              className="w-full btn btn-primary py-3"
            >
              Send Another Email
            </button>
          </div>
        )}
      </main>

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
