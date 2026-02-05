import Link from "next/link";
import { contributors } from "@/lib/contributors";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-radial opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Open Source Attendance System</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
              Attendance tracking
              <span className="block text-gradient">made simple</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-10">
              Location-based QR code check-in for clubs, courses, and organizations.
              Verify presence with rotating codes and geofencing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
              >
                Get Started Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 animate-fade-in-up delay-200">
            <div className="card p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rotating QR Codes</h3>
              <p className="text-sm text-gray-600">
                Auto-refreshing codes every 3 seconds prevent screenshot sharing
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Location Verification</h3>
              <p className="text-sm text-gray-600">
                Geofencing ensures attendees are physically present
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Blasts</h3>
              <p className="text-sm text-gray-600">
                Send announcements to attendees with custom templates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Credits */}
      <div className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Open Source Banner */}
          <div className="card p-6 mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.486 2 12.021c0 4.43 2.865 8.185 6.839 9.504.5.091.682-.217.682-.483 0-.238-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.455-1.157-1.11-1.466-1.11-1.466-.908-.62.069-.607.069-.607 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.221-.253-4.556-1.114-4.556-4.957 0-1.095.39-1.99 1.029-2.69-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.027A9.564 9.564 0 0 1 12 7.5c.85.004 1.705.115 2.504.337 1.909-1.297 2.748-1.027 2.748-1.027.546 1.378.202 2.397.099 2.65.64.7 1.028 1.595 1.028 2.69 0 3.852-2.339 4.701-4.566 4.949.36.31.68.92.68 1.854 0 1.338-.012 2.418-.012 2.747 0 .268.18.58.688.481A9.525 9.525 0 0 0 22 12.02C22 6.486 17.523 2 12 2Z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-gray-900">Open Source</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Free to use and modify. Contribute to make it better.
            </p>
            <a
              href="https://github.com/RiptideStar/attendance-location-for-groups"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              View on GitHub
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Credits */}
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contributors</h3>
            <p className="text-sm text-gray-600">
              Built with{" "}
              <a href="https://claude.com/product/claude-code" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Claude Code
              </a>
              , started at{" "}
              <a href="https://penncbc.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                UPenn Claude Builders Club
              </a>
            </p>
          </div>

          {contributors.length > 0 && (
            <div className="card p-6">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contributors.map((c, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center text-white font-medium text-xs">
                      {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-indigo-600 truncate block">
                          {c.name}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900 truncate block">{c.name}</span>
                      )}
                      {c.affiliation && (
                        <span className="text-gray-500 text-xs truncate block">{c.affiliation}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                Add yourself via <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">lib/contributors.ts</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
