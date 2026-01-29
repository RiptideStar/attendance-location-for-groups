import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Penn CBC Attendance</h1>
        <p className="text-gray-600 mb-8">
          Location-based QR code attendance system for Penn Claude Builders Club events
        </p>
        <Link
          href="/admin"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Admin Portal
        </Link>
      </div>
    </div>
  );
}
