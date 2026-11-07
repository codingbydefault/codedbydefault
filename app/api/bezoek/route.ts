import { NextRequest, NextResponse } from "next/server";
import { persistPageView } from "../../../lib/analytics/persist";
import { buildPageView, readClientIp, signalsFromHeaders } from "../../../lib/analytics/privacy";
import { isRecord } from "../../../lib/leads/fields";
import { pageViewWriter } from "../../../lib/supabase/writers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let path: unknown = null;
  try {
    const body = await request.json();
    path = isRecord(body) ? body.path : null;
  } catch {
    path = null;
  }

  const row = buildPageView({
    signals: signalsFromHeaders(request.method, request.headers),
    path,
    salt: process.env.ANALYTICS_SALT,
    ip: readClientIp(request.headers),
    now: new Date(),
  });
  const stored = await persistPageView(pageViewWriter(), row);
  if (!stored.ok) console.error("Pageview storage failed");
  return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
}
