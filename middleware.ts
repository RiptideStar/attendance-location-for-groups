import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Extract username from path (e.g., /penncbc/dashboard -> penncbc)
    const usernameMatch = pathname.match(/^\/([^\/]+)\//);

    if (usernameMatch) {
      const usernameInPath = usernameMatch[1];

      // Skip check for public routes
      if (
        usernameInPath === "event" ||
        usernameInPath === "api" ||
        usernameInPath === "login" ||
        usernameInPath === "register"
      ) {
        return NextResponse.next();
      }

      // Verify user belongs to this organization
      if (token?.organizationUsername !== usernameInPath) {
        // Redirect to their own organization's dashboard
        return NextResponse.redirect(
          new URL(`/${token?.organizationUsername}/dashboard`, req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public routes
        if (
          pathname === "/" ||
          pathname === "/login" ||
          pathname === "/register" ||
          pathname.startsWith("/event/") ||
          pathname.startsWith("/api/auth/") ||
          pathname.startsWith("/api/register") ||
          pathname.startsWith("/api/attendance") ||
          pathname.startsWith("/api/public/")
        ) {
          return true;
        }

        // Require token for all organization routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protect organization routes
    "/:username/dashboard/:path*",
    "/:username/events/:path*",
    "/:username/attendees/:path*",
    "/:username/recurring-events/:path*",
    // Also match old /admin routes for backward compatibility redirect
    "/admin/:path*",
  ],
};
