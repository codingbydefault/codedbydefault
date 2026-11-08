import "server-only";
import { createAdminClient } from "../supabase/admin";
import { parseAllowlist } from "./allowlist";

export async function syncAdminAllowlist() {
  const client = createAdminClient();
  if (!client) return;
  const emails = parseAllowlist(process.env.ADMIN_EMAILS);
  if (emails.length === 0) {
    const { error } = await client.from("admin_allowlist").delete().neq("email", "");
    if (error) console.error("Admin-allowlist leegmaken mislukt");
    return;
  }

  const { error: upsertError } = await client
    .from("admin_allowlist")
    .upsert(emails.map((email) => ({ email })), { onConflict: "email" });
  if (upsertError) {
    console.error("Admin-allowlist bijwerken mislukt");
    return;
  }

  const quoted = emails.map((email) => `"${email}"`).join(",");
  const { error: deleteError } = await client.from("admin_allowlist").delete().not("email", "in", `(${quoted})`);
  if (deleteError) console.error("Admin-allowlist opschonen mislukt");
}
