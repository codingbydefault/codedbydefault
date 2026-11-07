import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { shouldCountDownload, signalsFromHeaders } from "../../../../lib/analytics/privacy";
import { GUIDE_FILENAME } from "../../../../lib/guides/constants";
import { guideFilePath, persistDownload } from "../../../../lib/guides/download";
import { downloadRecorder } from "../../../../lib/supabase/writers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedPdf: Buffer | null = null;

async function loadPdf() {
  if (cachedPdf) return cachedPdf;
  cachedPdf = await readFile(guideFilePath());
  return cachedPdf;
}

function pdfHeaders(size: number) {
  return {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="${GUIDE_FILENAME}"`,
    "content-length": String(size),
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "x-robots-tag": "noindex",
    "accept-ranges": "none",
  };
}

async function respond(request: NextRequest, includeBody: boolean) {
  const signals = signalsFromHeaders(request.method, request.headers);
  let bytes: Buffer;
  try {
    bytes = await loadPdf();
  } catch (error) {
    console.error("Guide file missing", error instanceof Error ? error.message : "");
    return NextResponse.json({ message: "De gids is niet beschikbaar." }, { status: 404 });
  }

  if (includeBody && shouldCountDownload(signals)) {
    const stored = await persistDownload(downloadRecorder(), request.nextUrl.searchParams.get("t"));
    if (!stored.ok) console.error("Download storage failed");
  }

  return new NextResponse(includeBody ? new Uint8Array(bytes) : null, {
    status: 200,
    headers: pdfHeaders(bytes.length),
  });
}

export function GET(request: NextRequest) {
  return respond(request, true);
}

export function HEAD(request: NextRequest) {
  return respond(request, false);
}
