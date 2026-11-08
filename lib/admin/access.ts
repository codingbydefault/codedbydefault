import "server-only";
import { redirect } from "next/navigation";
import { createAuthClient } from "../supabase/server";
import { isAllowlisted, parseAllowlist } from "./allowlist";
import { syncAdminAllowlist } from "./sync";

export async function requireAdmin() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    && parseAllowlist(process.env.ADMIN_EMAILS).length > 0,
  );
  if (!configured) redirect("/admin/login?fout=configuratie");

  const supabase = await createAuthClient();
  if (!supabase) redirect("/admin/login?fout=configuratie");

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.email) redirect("/admin/login");
  if (!user.email_confirmed_at || !isAllowlisted(user.email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?fout=geen-toegang");
  }

  await syncAdminAllowlist();
  return { email: user.email };
}
