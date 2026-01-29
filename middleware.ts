export { default } from "next-auth/middleware";

// Protect all /admin routes EXCEPT the login page
export const config = {
  matcher: [
    "/admin",
    "/admin/events/:path*",
    "/admin/attendees/:path*",
  ],
};
