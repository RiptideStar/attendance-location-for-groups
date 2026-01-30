import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("ERROR: Missing required environment variables");
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  console.log("=== Multi-Tenant Migration Script ===\n");
  console.log("This script will:");
  console.log("1. Load the multi-tenant migration SQL");
  console.log("2. Attempt to run it in your Supabase database");
  console.log("3. Verify the migration completed successfully (no default org is seeded)\n");

  try {
    // Step 1: Read the migration SQL template
    console.log("Step 1: Reading migration SQL template...");
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/002_add_multi_tenant_support.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`ERROR: Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    console.log("✓ Migration template loaded\n");

    // Step 2: Execute migration via Supabase client
    console.log("Step 2: Executing migration in Supabase database...");
    console.log("Note: This will run the migration SQL directly.\n");

    // Split SQL by statement and execute each
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc("exec_sql", { sql: statement + ";" });

        if (error) {
          // If exec_sql function doesn't exist, we'll need to run via SQL editor
          if (error.message?.includes("exec_sql") || error.code === "42883") {
            console.log("\n⚠️  Direct SQL execution not available via Supabase client.");
            console.log("\nPlease run the migration manually:");
            console.log(`1. Open your Supabase dashboard SQL editor`);
            console.log(`2. Copy and paste the contents of:`);
            console.log(`   supabase/migrations/002_add_multi_tenant_support.sql`);
            console.log(`3. Execute the SQL\n`);
            console.log("Note: The migration does not seed any default organizations.");
            return;
          }

          console.error(`Error executing statement: ${error.message}`);
          throw error;
        }
      }
    }

    console.log("✓ Migration SQL executed\n");

    // Verification: ensure organizations table exists
    console.log("Step 3: Verifying migration (organizations table exists)...");
    const { error: verifyError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    if (verifyError) {
      console.error("⚠️  Verification failed:", verifyError.message);
      console.log("Please check your database schema in Supabase.");
      return;
    }

    console.log("=== Migration Completed Successfully! ===\n");
    console.log("Next steps:");
    console.log("  1. Start the app and register your first organization at /register");
    console.log("  2. Sign in at /login with your new credentials");
    console.log("  3. Create events and test check-in\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\nPlease check the error message above and try again.");
    console.error("If the issue persists, you may need to run the migration manually via the Supabase SQL editor.\n");
    process.exit(1);
  }
}

runMigration();
