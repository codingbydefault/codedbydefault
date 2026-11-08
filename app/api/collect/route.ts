import { NextRequest, NextResponse } from "next/server";
import { persistPageView } from "../../../lib/analytics/persist";
import { readClientIp, signalsFromHeaders } from "../../../lib/analytics/privacy";
import { createRateLimiter } from "../../../lib/analytics/rate-limit";
import { buildCollectRecord, corsHeaders, parseCollectBody } from "../../../lib/analytics/sites";
import { pageViewWriter } from "../../../lib/supabase/writers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowCollect = createRateLimiter({ limit: 30, windowMs: 60_000 });

function empty(origin: string | null, status = 204) {
  return new NextResponse(null, { status, headers: corsHeaders(origin) });
}

export function OPTIONS(request: NextRequest) {
  return empty(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const signals = signalsFromHeaders(request.method, request.headers);
  let body: unknown = null;
  try {
    body = parseCollectBody(await request.text());
  } catch {
    body = null;
  }
  const row = buildCollectRecord({
    origin,
    body,
    signals,
    salt: process.env.ANALYTICS_SALT,
    ip: readClientIp(request.headers),
    now: new Date(),
  });
  if (row && allowCollect(row.visitor_hash, Date.now())) {
    const stored = await persistPageView(pageViewWriter(), row);
    if (!stored.ok) console.error("Collect storage failed");
  }
  return empty(origin);
}
