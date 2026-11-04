import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const OWNER_EMAIL = "codedbydefault@gmail.com";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

async function sendEmail(payload: Record<string, unknown>, apiKey: string) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend quickscan error", response.status, detail);
    throw new Error("E-mail kon niet worden verstuurd");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = clean(body.name, 100);
    const company = clean(body.company, 150);
    const email = clean(body.email, 254).toLowerCase();
    const url = clean(body.url, 500);
    const question = clean(body.question, 2000);
    const honeypot = clean(body.website, 200);

    if (honeypot) return NextResponse.json({ ok: true });

    if (!name || !email || !url) {
      return NextResponse.json({ message: "Vul je naam, e-mailadres en webadres in." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Vul een geldig e-mailadres in." }, { status: 400 });
    }

    let website: URL;
    try {
      website = new URL(url);
      if (!["http:", "https:"].includes(website.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ message: "Vul een volledig webadres in, inclusief https://." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.QUICKSCAN_FROM_EMAIL;
    if (!apiKey || !from) {
      console.error("Quickscan mail configuration is missing");
      return NextResponse.json({ message: "De mailverbinding is nog niet actief." }, { status: 503 });
    }

    const safeName = escapeHtml(name);
    const safeCompany = escapeHtml(company || "Niet ingevuld");
    const safeUrl = escapeHtml(website.toString());
    const safeQuestion = escapeHtml(question || "Geen specifiek aandachtspunt opgegeven.").replace(/\n/g, "<br>");
    const requestId = crypto.randomUUID();
    const receivedAt = new Date().toISOString();
    const botRecord = {
      schema: "codedbydefault.quickscan.v1",
      requestId,
      receivedAt,
      status: "new",
      reportDueWithinHours: 24,
      customer: { name, company: company || null, email },
      website: website.toString(),
      focus: question || null,
      requestedOutput: "Persoonlijk rapport met drie mogelijke websiteverbeteringen",
    };

    await Promise.all([
      sendEmail({
        from,
        to: [email],
        reply_to: OWNER_EMAIL,
        subject: "We hebben je website-quickscan ontvangen",
        text: `Hallo ${name},\n\nBedankt voor je aanvraag. We hebben je gegevens goed ontvangen en zijn je website aan het bekijken.\n\nBinnen 24 uur ontvang je van ons een persoonlijk en gedetailleerd rapport over je website, met drie mogelijke verbeteringen die je kunt toevoegen of doorvoeren.\n\nWebsite: ${website.toString()}\n\nMet vriendelijke groet,\nCodedByDefault\nIT · AI · Software · Webdesign`,
        html: `<div style="margin:0;background:#0b0d12;padding:40px 20px;font-family:Arial,sans-serif;color:#f6f4ee"><div style="max-width:620px;margin:auto;border:1px solid #30343c;border-radius:14px;overflow:hidden"><div style="padding:34px;background:#c7ff35;color:#090b0f"><p style="margin:0 0 12px;font-size:12px;letter-spacing:2px;text-transform:uppercase">CodedByDefault / Quickscan</p><h1 style="margin:0;font-size:32px;line-height:1.05">Aanvraag ontvangen.</h1></div><div style="padding:34px"><p>Hallo ${safeName},</p><p style="line-height:1.7;color:#c7cad0">Bedankt voor je aanvraag. We hebben je gegevens goed ontvangen en zijn je website aan het bekijken.</p><p style="line-height:1.7;color:#c7cad0"><strong style="color:#fff">Binnen 24 uur</strong> ontvang je van ons een persoonlijk en gedetailleerd rapport over je website, met drie mogelijke verbeteringen die je kunt toevoegen of doorvoeren.</p><p style="margin:28px 0;padding:16px;border-left:3px solid #765cff;background:#151820;color:#c7cad0">Website: ${safeUrl}</p><p style="margin-top:30px">Met vriendelijke groet,<br><strong>CodedByDefault</strong><br><span style="font-size:12px;color:#838892">IT · AI · Software · Webdesign</span></p></div></div></div>`,
      }, apiKey),
      sendEmail({
        from,
        to: [OWNER_EMAIL],
        reply_to: email,
        subject: `[QUICKSCAN][NEW][${requestId}] ${company || name}`,
        headers: {
          "X-CodedByDefault-Type": "quickscan",
          "X-CodedByDefault-Schema": "codedbydefault.quickscan.v1",
          "X-CodedByDefault-Request-Id": requestId,
        },
        text: `QUICKSCAN_RECORD_V1\n${JSON.stringify(botRecord, null, 2)}\nEND_QUICKSCAN_RECORD\n\nLeesbare samenvatting\nNaam: ${name}\nBedrijf: ${company || "Niet ingevuld"}\nE-mail: ${email}\nWebsite: ${website.toString()}\nExtra aandachtspunt: ${question || "Geen specifiek aandachtspunt opgegeven."}\nAfspraak: persoonlijk rapport met drie mogelijke verbeteringen binnen 24 uur.`,
        html: `<h1>Nieuwe website-quickscan</h1><p><strong>Aanvraagnummer:</strong> ${requestId}<br><strong>Ontvangen:</strong> ${receivedAt}<br><strong>Status:</strong> nieuw</p><p><strong>Naam:</strong> ${safeName}<br><strong>Bedrijf:</strong> ${safeCompany}<br><strong>E-mail:</strong> ${escapeHtml(email)}<br><strong>Website:</strong> <a href="${safeUrl}">${safeUrl}</a></p><p><strong>Extra aandachtspunt:</strong><br>${safeQuestion}</p><p><strong>Afspraak:</strong> persoonlijk rapport met drie mogelijke verbeteringen binnen 24 uur.</p><hr><pre style="white-space:pre-wrap;font-size:11px;color:#666">${escapeHtml(JSON.stringify(botRecord, null, 2))}</pre>`,
      }, apiKey),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Quickscan submission failed", error);
    return NextResponse.json({ message: "Versturen is tijdelijk niet gelukt." }, { status: 500 });
  }
}
