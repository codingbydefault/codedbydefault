import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const OWNER_EMAIL = "codedbydefault@gmail.com";
const GUIDE_PATH = "/downloads/codedbydefault-mkb-ai-automatiseringsgids-2026.pdf";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

async function sendEmail(payload: Record<string, unknown>, apiKey: string) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error("Resend guide error", response.status, await response.text());
    throw new Error("E-mail kon niet worden verstuurd");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 100);
    const email = clean(body.email, 254).toLowerCase();
    const honeypot = clean(body.website, 200);
    if (honeypot) return NextResponse.json({ ok: true });
    if (!name || !email) return NextResponse.json({ message: "Vul je naam en e-mailadres in." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ message: "Vul een geldig e-mailadres in." }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.QUICKSCAN_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error("Guide mail configuration is missing");
      return NextResponse.json({ message: "De mailverbinding is nog niet actief." }, { status: 503 });
    }

    const requestId = crypto.randomUUID();
    const receivedAt = new Date().toISOString();
    const guideUrl = new URL(GUIDE_PATH, request.nextUrl.origin).toString();
    const safeName = escapeHtml(name);
    const leadRecord = { schema: "codedbydefault.guide-lead.v1", requestId, receivedAt, status: "guide_sent", name, email, guide: "mkb-ai-automatiseringsgids-2026" };

    await Promise.all([
      sendEmail({
        from,
        to: [email],
        reply_to: OWNER_EMAIL,
        subject: "Jouw CodedByDefault AI- & Automatiseringsgids",
        text: `Hallo ${name},\n\nBedankt voor je aanvraag. Download hier de MKB AI- & Automatiseringsgids 2026:\n${guideUrl}\n\nJe ontvangt van ons geen automatische nieuwsbrief.\n\nMet vriendelijke groet,\nCodedByDefault`,
        html: `<div style="margin:0;background:#0b0d12;padding:40px 20px;font-family:Arial,sans-serif;color:#f6f4ee"><div style="max-width:620px;margin:auto;border:1px solid #30343c;border-radius:14px;overflow:hidden"><div style="padding:34px;background:#c7ff35;color:#090b0f"><p style="margin:0 0 12px;font-size:12px;letter-spacing:2px;text-transform:uppercase">CodedByDefault / Gratis gids</p><h1 style="margin:0;font-size:30px;line-height:1.08">Jouw gids staat klaar.</h1></div><div style="padding:34px"><p>Hallo ${safeName},</p><p style="line-height:1.7;color:#c7cad0">Ontdek tien praktische kansen om bedrijfsprocessen slimmer in te richten met maatwerksoftware en AI.</p><p style="margin:30px 0"><a href="${guideUrl}" style="display:inline-block;background:#765cff;color:#fff;text-decoration:none;border-radius:999px;padding:16px 24px;font-weight:bold">Download de gids</a></p><p style="font-size:12px;line-height:1.6;color:#838892">Je ontvangt van ons geen automatische nieuwsbrief. Je e-mailadres is alleen gebruikt om deze gids te versturen.</p><p style="margin-top:30px">Met vriendelijke groet,<br><strong>CodedByDefault</strong></p></div></div></div>`,
      }, apiKey),
      sendEmail({
        from,
        to: [OWNER_EMAIL],
        reply_to: email,
        subject: `[GUIDE-LEAD][NEW][${requestId}] ${name}`,
        headers: { "X-CodedByDefault-Type": "guide-lead", "X-CodedByDefault-Schema": "codedbydefault.guide-lead.v1", "X-CodedByDefault-Request-Id": requestId },
        text: `GUIDE_LEAD_RECORD_V1\n${JSON.stringify(leadRecord, null, 2)}\nEND_GUIDE_LEAD_RECORD`,
        html: `<h1>Nieuwe gidsaanvraag</h1><p><strong>Naam:</strong> ${safeName}<br><strong>E-mail:</strong> ${escapeHtml(email)}<br><strong>Aanvraagnummer:</strong> ${requestId}</p><pre>${escapeHtml(JSON.stringify(leadRecord, null, 2))}</pre>`,
      }, apiKey),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Guide submission failed", error);
    return NextResponse.json({ message: "Versturen is tijdelijk niet gelukt." }, { status: 500 });
  }
}
