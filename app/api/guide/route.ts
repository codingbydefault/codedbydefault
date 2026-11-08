import { NextRequest, NextResponse } from "next/server";
import { buildGuideDownloadUrl, createDownloadToken } from "../../../lib/guides/download";
import { buildGuideInsert, parseGuideSubmission } from "../../../lib/leads/guide";
import { persistGuide } from "../../../lib/leads/persist";
import { guideWriter } from "../../../lib/supabase/writers";

export const runtime = "nodejs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const OWNER_EMAIL = "codedbydefault@gmail.com";

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
    const body = await request.json().catch(() => null);
    const parsed = parseGuideSubmission(body);
    if (parsed.kind === "honeypot") return NextResponse.json({ ok: true });
    if (parsed.kind === "invalid") return NextResponse.json({ message: parsed.message }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.QUICKSCAN_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error("Guide mail configuration is missing");
      return NextResponse.json({ message: "De mailverbinding is nog niet actief." }, { status: 503 });
    }

    const { name, email } = parsed.value;
    const requestId = crypto.randomUUID();
    const downloadToken = createDownloadToken();
    const receivedAt = new Date().toISOString();
    const stored = await persistGuide(guideWriter(), buildGuideInsert({ requestId, name, email, downloadToken }));
    if (!stored.ok) console.error("Guide lead storage failed");
    const guideUrl = buildGuideDownloadUrl(request.nextUrl.origin, downloadToken);
    const safeGuideUrl = escapeHtml(guideUrl);
    const logoUrl = new URL("/assets/codedbydefault-logo-v02.png", request.nextUrl.origin).toString();
    const safeName = escapeHtml(name);
    const leadRecord = { schema: "codedbydefault.guide-lead.v1", requestId, receivedAt, status: "guide_sent", name, email, guide: "cbd-ai-automatiseringsgids-2026" };

    await Promise.all([
      sendEmail({
        from,
        to: [email],
        reply_to: OWNER_EMAIL,
        subject: "Jouw CBD AI- & Automatiseringsgids staat klaar",
        text: `Hallo ${name},\n\nJouw CBD AI- & Automatiseringsgids staat klaar.\n\nGeen algemeen AI-verhaal, maar tien concrete kansen om processen slimmer, sneller en overzichtelijker in te richten met maatwerksoftware en AI.\n\nDownload de gids:\n${guideUrl}\n\nJe ontvangt van ons geen automatische nieuwsbrief. Je e-mailadres is alleen gebruikt om deze gids te versturen.\n\nCodedByDefault\nIT · AI · Software · Webdesign`,
        html: `<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Jouw CBD-gids staat klaar</title></head><body style="margin:0;padding:0;background:#090b0f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#090b0f"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#0f1218;border:1px solid #292d35;border-radius:18px;overflow:hidden"><tr><td style="padding:26px 28px;border-bottom:1px solid #292d35"><img src="${logoUrl}" width="156" alt="CodedByDefault" style="display:block;width:156px;max-width:48%;height:auto;border:0"><p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;letter-spacing:2.2px;color:#9da1a8;text-transform:uppercase">IT &nbsp;·&nbsp; AI &nbsp;·&nbsp; Software &nbsp;·&nbsp; Webdesign</p></td></tr><tr><td style="padding:0 28px 28px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin-top:28px;background:#080a0e;border:1px solid #30343c;border-radius:14px;overflow:hidden"><tr><td style="padding:28px 26px 32px"><p style="margin:0 0 26px;font-family:Arial,sans-serif;font-size:10px;line-height:1.4;letter-spacing:2px;color:#9da1a8;text-transform:uppercase">Praktische gids &nbsp;/&nbsp; Editie 2026</p><h1 style="margin:0;font-family:Arial Black,Arial,sans-serif;font-size:34px;line-height:.94;letter-spacing:-1.7px;color:#f6f4ee;text-transform:uppercase">De CBD<br>AI- &amp;<br><span style="color:#c7ff35">automatiserings-</span><br>gids</h1><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px"><tr><td style="height:4px;background:#c7ff35;font-size:1px;line-height:1px">&nbsp;</td><td width="54" style="height:4px;background:#765cff;font-size:1px;line-height:1px">&nbsp;</td></tr></table><p style="margin:22px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#aeb2b9">10 praktische manieren om bedrijfsprocessen te versnellen en slimmer in te richten met maatwerksoftware en AI.</p></td></tr></table><p style="margin:30px 0 0;font-family:Arial,sans-serif;font-size:17px;line-height:1.5;color:#f6f4ee">Hallo ${safeName},</p><p style="margin:13px 0 0;font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#b9bdc5">Jouw gids staat klaar. Geen algemeen AI-verhaal, maar tien concrete kansen die laten zien waar slimme software en automatisering verschil kunnen maken.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 30px"><tr><td bgcolor="#c7ff35" style="border-radius:999px"><a href="${safeGuideUrl}" style="display:inline-block;padding:17px 25px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;line-height:1;color:#090b0f;text-decoration:none">Download de gids &nbsp;↗</a></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-top:1px solid #292d35"><tr><td style="padding-top:23px"><p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#7f858f">Geen automatische nieuwsbrief. Je e-mailadres is alleen gebruikt om deze gids naar je te versturen.</p><p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#f6f4ee"><strong>CodedByDefault</strong><br><span style="color:#765cff">We build beyond default.</span></p></td></tr></table></td></tr></table></td></tr></table></body></html>`,
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
