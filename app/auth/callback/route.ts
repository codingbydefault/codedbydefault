import { NextRequest, NextResponse } from "next/server";
import { isAllowlisted } from "../../../lib/admin/allowlist";
import { syncAdminAllowlist } from "../../../lib/admin/sync";
import { createAuthClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.includes("\\")) return "/admin";
  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/admin/login?fout=link", request.url));

  const supabase = await createAuthClient();
  if (!supabase) return NextResponse.redirect(new URL("/admin/login?fout=configuratie", request.url));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/login?fout=link", request.url));

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !user.email_confirmed_at || !isAllowlisted(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?fout=geen-toegang", request.url));
  }

  await syncAdminAllowlist();
  return NextResponse.redirect(new URL(next, request.url));
}
