import { withAuth } from "next-auth/middleware";

// Protect all /admin routes EXCEPT the login page
export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: [
    "/admin",
    "/admin/events/:path*",
    "/admin/attendees/:path*",
  ],
};
