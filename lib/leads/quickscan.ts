import { clean, EMAIL_PATTERN, isRecord, type ParseResult } from "./fields";

export type QuickscanSubmission = {
  name: string;
  company: string | null;
  email: string;
  website: string;
  question: string | null;
};

export type QuickscanInsert = {
  request_id: string;
  name: string;
  company: string | null;
  email: string;
  website: string;
  question: string | null;
  status: "new";
};

export function parseQuickscanSubmission(body: unknown): ParseResult<QuickscanSubmission> {
  const record = isRecord(body) ? body : {};
  const name = clean(record.name, 100);
  const company = clean(record.company, 150);
  const email = clean(record.email, 254).toLowerCase();
  const url = clean(record.url, 500);
  const question = clean(record.question, 2000);
  const honeypot = clean(record.website, 200);

  if (honeypot) return { kind: "honeypot" };
  if (!name || !email || !url) {
    return { kind: "invalid", message: "Vul je naam, e-mailadres en webadres in." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { kind: "invalid", message: "Vul een geldig e-mailadres in." };
  }

  let website: URL;
  try {
    website = new URL(url);
    if (!["http:", "https:"].includes(website.protocol)) throw new Error("protocol");
  } catch {
    return { kind: "invalid", message: "Vul een volledig webadres in, inclusief https://." };
  }

  return {
    kind: "ok",
    value: {
      name,
      company: company || null,
      email,
      website: website.toString(),
      question: question || null,
    },
  };
}

export function buildQuickscanInsert(input: {
  requestId: string;
  submission: QuickscanSubmission;
}): QuickscanInsert {
  return {
    request_id: input.requestId,
    name: input.submission.name,
    company: input.submission.company,
    email: input.submission.email,
    website: input.submission.website,
    question: input.submission.question,
    status: "new",
  };
}
