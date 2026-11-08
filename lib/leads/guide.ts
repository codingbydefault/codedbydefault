import { GUIDE_SLUG } from "../guides/constants";
import { clean, EMAIL_PATTERN, isRecord, type ParseResult } from "./fields";

export type GuideSubmission = {
  name: string;
  email: string;
};

export type GuideInsert = {
  request_id: string;
  name: string;
  email: string;
  guide: typeof GUIDE_SLUG;
  status: "guide_sent";
  download_token: string;
};

export function parseGuideSubmission(body: unknown): ParseResult<GuideSubmission> {
  const record = isRecord(body) ? body : {};
  const name = clean(record.name, 100);
  const email = clean(record.email, 254).toLowerCase();
  const honeypot = clean(record.website, 200);
  if (honeypot) return { kind: "honeypot" };
  if (!name || !email) return { kind: "invalid", message: "Vul je naam en e-mailadres in." };
  if (!EMAIL_PATTERN.test(email)) return { kind: "invalid", message: "Vul een geldig e-mailadres in." };
  return { kind: "ok", value: { name, email } };
}

export function buildGuideInsert(input: {
  requestId: string;
  name: string;
  email: string;
  downloadToken: string;
}): GuideInsert {
  return {
    request_id: input.requestId,
    name: input.name,
    email: input.email,
    guide: GUIDE_SLUG,
    status: "guide_sent",
    download_token: input.downloadToken,
  };
}
