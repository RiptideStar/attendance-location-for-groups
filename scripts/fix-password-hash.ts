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
  const orgUsername = process.env.ORG_USERNAME;
  const newPassword = process.env.NEW_PASSWORD;

  if (!orgUsername || !newPassword) {
    console.error("ERROR: Missing ORG_USERNAME or NEW_PASSWORD env variables");
    console.error("Usage: ORG_USERNAME=yourorg NEW_PASSWORD=strongpass npm run fix-password-hash");
    process.exit(1);
  }

  console.log(`Rotating password for organization: ${orgUsername}\n`);

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from("organizations")
      .update({ password_hash: passwordHash })
      .eq("username", orgUsername);

    if (error) {
      console.error("Error updating password hash:", error);
      process.exit(1);
    }

    console.log("✅ Password rotated successfully.");
    console.log("Note: Do not share passwords in logs. Distribute the new password securely.");
  } catch (error) {
    console.error("\n❌ Failed to update password hash:", error);
    process.exit(1);
  }
}

fixPasswordHash();
