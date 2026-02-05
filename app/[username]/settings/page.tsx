"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminNav } from "@/components/admin/AdminNav";

interface SmtpSettings {
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_secure: boolean | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
  smtp_reply_to: string | null;
  hasPassword: boolean;
}

export default function OrganizationSettingsPage() {
  const { data: session } = useSession();
  const username = session?.user?.organizationUsername || "";
  const organizationName = session?.user?.organizationName || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [smtpReplyTo, setSmtpReplyTo] = useState("");
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/organization/smtp");
        if (!response.ok) {
          throw new Error("Failed to load SMTP settings");
        }
        const data: SmtpSettings = await response.json();
        setSmtpHost(data.smtp_host || "");
        setSmtpPort(data.smtp_port ? String(data.smtp_port) : "");
        setSmtpUser(data.smtp_user || "");
        setSmtpSecure(data.smtp_secure ?? true);
        setSmtpFromEmail(data.smtp_from_email || "");
        setSmtpFromName(data.smtp_from_name || "");
        setSmtpReplyTo(data.smtp_reply_to || "");
        setHasPassword(data.hasPassword);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        smtp_host: smtpHost,
        smtp_port: smtpPort ? Number(smtpPort) : undefined,
        smtp_user: smtpUser,
        smtp_secure: smtpSecure,
        smtp_from_email: smtpFromEmail,
        smtp_from_name: smtpFromName || null,
        smtp_reply_to: smtpReplyTo || null,
      };

      if (smtpPass.trim().length > 0) {
        payload.smtp_pass = smtpPass;
      }

      const response = await fetch("/api/organization/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update SMTP settings");
      }

      setHasPassword(Boolean(data.hasPassword));
      setSmtpPass("");
      setSuccess("SMTP settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav username={username} organizationName={organizationName} />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">Configure your organization settings</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">SMTP Configuration</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Configure email settings to send announcements to your attendees
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {error && (
                <div className="alert alert-error animate-fade-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="alert alert-success animate-fade-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label htmlFor="smtp-host" className="label">SMTP Host</label>
                <input
                  id="smtp-host"
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="input"
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtp-port" className="label">SMTP Port</label>
                  <input
                    id="smtp-port"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="input"
                    placeholder="465"
                  />
                </div>
                <div className="flex items-center gap-3 sm:mt-8">
                  <input
                    id="smtp-secure"
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="smtp-secure" className="text-sm text-gray-700">
                    Use TLS/SSL
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="smtp-user" className="label">SMTP Username</label>
                <input
                  id="smtp-user"
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="smtp-pass" className="label">SMTP Password</label>
                <input
                  id="smtp-pass"
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="input"
                  placeholder={hasPassword ? "••••••••" : "Enter password"}
                />
                {hasPassword && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Password already saved. Leave blank to keep it.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtp-from-name" className="label">From Name</label>
                  <input
                    id="smtp-from-name"
                    type="text"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    className="input"
                    placeholder="Club Name"
                  />
                </div>
                <div>
                  <label htmlFor="smtp-from-email" className="label">From Email</label>
                  <input
                    id="smtp-from-email"
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    className="input"
                    placeholder="club@example.org"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="smtp-reply-to" className="label">Reply-To (optional)</label>
                <input
                  id="smtp-reply-to"
                  type="email"
                  value={smtpReplyTo}
                  onChange={(e) => setSmtpReplyTo(e.target.value)}
                  className="input"
                  placeholder="reply@example.org"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
