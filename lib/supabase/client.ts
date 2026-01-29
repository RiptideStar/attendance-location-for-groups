import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Browser-side Supabase client
// Uses the anonymous/public key which is safe to expose to the client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using NextAuth for session management
  },
});
