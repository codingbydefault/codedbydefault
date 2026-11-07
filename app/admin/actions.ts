"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/admin/access";
import { syncAdminAllowlist } from "../../lib/admin/sync";
import { isAllowlisted } from "../../lib/admin/allowlist";
import { parseProjectUpdate } from "../../lib/admin/projects";
import { createAdminClient } from "../../lib/supabase/admin";
import { createAuthClient } from "../../lib/supabase/server";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function login(formData: FormData) {
  const email = text(formData, "email").trim().toLowerCase();
  const password = text(formData, "password");
  if (!email || !password) redirect("/admin/login?fout=ontbrekend");

  const supabase = await createAuthClient();
  if (!supabase) redirect("/admin/login?fout=configuratie");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?fout=mislukt");

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !user.email_confirmed_at || !isAllowlisted(user.email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?fout=geen-toegang");
  }

  await syncAdminAllowlist();
  redirect("/admin");
}

export async function sendMagicLink(formData: FormData) {
  const email = text(formData, "email").trim().toLowerCase();
  if (!email) redirect("/admin/login?fout=ontbrekend");

  const origin = (await headers()).get("origin");
  const supabase = await createAuthClient();
  if (supabase && origin && isAllowlisted(email)) {
    await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${origin}/auth/callback?next=/admin`,
      },
    });
  }

  redirect("/admin/login?melding=verstuurd");
}

export async function logout() {
  const supabase = await createAuthClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateProject(formData: FormData) {
  await requireAdmin();
  const parsed = parseProjectUpdate({
    slug: text(formData, "slug"),
    status: text(formData, "status"),
    progress: text(formData, "progress"),
    url: text(formData, "url"),
    summary: text(formData, "summary"),
  });
  if (!parsed.ok) redirect("/admin?fout=project");

  const client = createAdminClient();
  if (!client) redirect("/admin?fout=opslag");

  const { data, error } = await client
    .from("projects")
    .update({
      status: parsed.value.status,
      progress: parsed.value.progress,
      url: parsed.value.url,
      summary: parsed.value.summary,
    })
    .eq("slug", parsed.value.slug)
    .select("slug")
    .maybeSingle();

  if (error || !data) redirect("/admin?fout=project");
  redirect(`/admin?opgeslagen=${parsed.value.slug}`);
}
