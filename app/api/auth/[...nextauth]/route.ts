import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Organization Login",
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
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Fetch organization from database
          const { data: organization, error } = await supabaseAdmin
            .from("organizations")
            .select("*")
            .eq("username", credentials.username.toLowerCase().trim())
            .single();

          if (error || !organization) {
            console.error("Organization not found:", credentials.username);
            return null;
          }

          const org = organization as Organization;

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            org.password_hash
          );

          if (!isValidPassword) {
            console.error("Invalid password for:", credentials.username);
            return null;
          }

          // Return user object with organization context
          return {
            id: org.id,
            name: org.name,
            email: `admin@${org.username}.org`, // Synthetic email
            organizationId: org.id,
            organizationUsername: org.username,
            organizationName: org.name,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login", // Global login page
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
        token.organizationId = user.organizationId;
        token.organizationUsername = user.organizationUsername;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationUsername = token.organizationUsername as string;
        session.user.organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
