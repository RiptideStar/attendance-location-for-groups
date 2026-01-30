import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("ERROR: Missing required environment variables");
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixPasswordHash() {
  console.log("Fixing password hash for penncbc organization...\n");

  try {
    // Generate proper password hash
    const defaultPassword = "penncbc123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    console.log(`Generated password hash for: "${defaultPassword}"`);

    // Update the organization
    const { data, error } = await supabase
      .from("organizations")
      .update({ password_hash: passwordHash })
      .eq("username", "penncbc")
      .select();

    if (error) {
      console.error("Error updating password hash:", error);
      process.exit(1);
    }

    console.log("\n✅ Password hash updated successfully!");
    console.log("\nYou can now log in with:");
    console.log("  Username: penncbc");
    console.log("  Password: penncbc123");
    console.log("  URL: http://localhost:3000/login\n");

  } catch (error) {
    console.error("\n❌ Failed to update password hash:", error);
    process.exit(1);
  }
}

fixPasswordHash();
