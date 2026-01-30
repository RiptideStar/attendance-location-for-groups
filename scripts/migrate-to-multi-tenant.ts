import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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
  console.log("1. Generate a password hash for the default penncbc organization");
  console.log("2. Create a modified migration SQL file with the hash");
  console.log("3. Run the migration in your Supabase database");
  console.log("4. Verify the migration completed successfully\n");

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

    let migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    console.log("✓ Migration template loaded\n");

    // Step 2: Generate password hash for penncbc
    console.log("Step 2: Generating password hash for default organization...");
    const defaultPassword = "penncbc123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    console.log(`✓ Password hash generated for password: "${defaultPassword}"\n`);

    // Step 3: Replace placeholder in SQL
    console.log("Step 3: Injecting password hash into SQL...");
    migrationSQL = migrationSQL.replace(
      "$2a$10$PLACEHOLDER_WILL_BE_REPLACED",
      passwordHash
    );
    console.log("✓ Password hash injected\n");

    // Step 4: Save the modified SQL to a temporary file
    const tempSQLPath = path.join(__dirname, "../supabase/migrations/002_add_multi_tenant_support_ready.sql");
    fs.writeFileSync(tempSQLPath, migrationSQL);
    console.log(`✓ Modified SQL saved to: ${tempSQLPath}\n`);

    // Step 5: Execute migration via Supabase client
    console.log("Step 4: Executing migration in Supabase database...");
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
          if (error.message.includes("exec_sql") || error.code === "42883") {
            console.log("\n⚠️  Direct SQL execution not available via Supabase client.");
            console.log("\nPlease run the migration manually:");
            console.log(`1. Open your Supabase dashboard SQL editor`);
            console.log(`2. Copy and paste the contents of:`);
            console.log(`   ${tempSQLPath}`);
            console.log(`3. Execute the SQL\n`);
            console.log("The migration SQL has been prepared with the password hash.");
            console.log(`Default credentials will be:`);
            console.log(`  Username: penncbc`);
            console.log(`  Password: ${defaultPassword}\n`);
            return;
          }

          console.error(`Error executing statement: ${error.message}`);
          throw error;
        }
      }
    }

    console.log("✓ Migration SQL executed\n");

    // Step 6: Verify migration
    console.log("Step 5: Verifying migration...");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("username", "penncbc")
      .single();

    if (orgError) {
      console.error("⚠️  Could not verify organization creation:", orgError.message);
      console.log("\nPlease verify manually in your Supabase dashboard.");
      return;
    }

    console.log("✓ Organization created successfully:");
    console.log(`  ID: ${org.id}`);
    console.log(`  Username: ${org.username}`);
    console.log(`  Name: ${org.name}\n`);

    const { count: eventsCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);

    const { count: attendeesCount } = await supabase
      .from("attendees")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);

    const { count: recurringEventsCount } = await supabase
      .from("recurring_events")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id);

    console.log("Data migration verified:");
    console.log(`  Events migrated: ${eventsCount}`);
    console.log(`  Attendees migrated: ${attendeesCount}`);
    console.log(`  Recurring events migrated: ${recurringEventsCount}\n`);

    console.log("=== Migration Completed Successfully! ===\n");
    console.log("Default login credentials:");
    console.log(`  Username: penncbc`);
    console.log(`  Password: ${defaultPassword}`);
    console.log(`  Login URL: http://localhost:3000/login\n`);
    console.log("You can now access your dashboard at: http://localhost:3000/penncbc/dashboard");
    console.log("\n✅ All done! Your application is now multi-tenant enabled.\n");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\nPlease check the error message above and try again.");
    console.error("If the issue persists, you may need to run the migration manually via the Supabase SQL editor.\n");
    process.exit(1);
  }
}

runMigration();
