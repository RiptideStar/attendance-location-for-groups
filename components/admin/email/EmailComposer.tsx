"use client";

interface EmailComposerProps {
  subject: string;
  body: string;
  isHtml: boolean;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
  onIsHtmlChange: (isHtml: boolean) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

export function EmailComposer({
  subject,
  body,
  isHtml,
  onSubjectChange,
  onBodyChange,
  onIsHtmlChange,
  onBack,
  onNext,
  loading = false,
}: EmailComposerProps) {
  const isValid = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Compose Email</h2>

      <div className="space-y-6">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Enter email subject..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Format toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Format:</span>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={!isHtml}
              onChange={() => onIsHtmlChange(false)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-sm">Plain Text</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={isHtml}
              onChange={() => onIsHtmlChange(true)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-sm">HTML</span>
          </label>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Body <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder={
              isHtml
                ? "<p>Enter your HTML email content here...</p>"
                : "Enter your email message here..."
            }
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          {isHtml && (
            <p className="mt-2 text-sm text-gray-500">
              You can use HTML tags like &lt;p&gt;, &lt;br&gt;, &lt;strong&gt;,
              &lt;a href=&quot;...&quot;&gt;, etc.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!isValid || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Loading...
              </>
            ) : (
              "Preview Email"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
