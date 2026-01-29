import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "penncbc",
  password: process.env.ADMIN_PASSWORD || "penncbc123",
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter password",
        },
      },
      async authorize(credentials) {
        // Verify credentials
        if (
          credentials?.username === ADMIN_CREDENTIALS.username &&
          credentials?.password === ADMIN_CREDENTIALS.password
        ) {
          // Return user object on successful authentication
          return {
            id: "admin",
            name: "Penn CBC Admin",
            email: "admin@penncbc.org",
          };
        }

        // Return null if credentials are invalid
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login", // Custom login page
  },
  session: {
    strategy: "jwt", // Use JWT for stateless sessions
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token on sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
