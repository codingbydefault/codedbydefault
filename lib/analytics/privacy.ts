import { createHmac } from "node:crypto";
import { amsterdamDayKey } from "../admin/time";

const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|quora|pinterest|slackbot|twitterbot|whatsapp|telegram|discordbot|linkedinbot|applebot|baiduspider|yandex|semrush|ahrefs|petalbot|bytespider|gptbot|claudebot|amazonbot|headless|phantom|selenium|wget|curl|python-requests|go-http-client|axios|node-fetch|uptime|pingdom|statuscake|lighthouse|pagespeed|dataprovider|monitoring|proofpoint|mimecast|barracuda/i;

export type RequestSignals = {
  method: string;
  userAgent: string;
  purpose: string;
  secPurpose: string;
  secFetchSite: string;
  nextPrefetch: string;
};

export function signalsFromHeaders(method: string, headers: Headers): RequestSignals {
  return {
    method: method.toUpperCase(),
    userAgent: headers.get("user-agent")?.trim() ?? "",
    purpose: headers.get("purpose")?.trim().toLowerCase() ?? "",
    secPurpose: headers.get("sec-purpose")?.trim().toLowerCase() ?? "",
    secFetchSite: headers.get("sec-fetch-site")?.trim().toLowerCase() ?? "",
    nextPrefetch: headers.get("next-router-prefetch")?.trim() ?? "",
  };
}

export function isBotUserAgent(userAgent: string) {
  const value = userAgent.trim();
  if (!value) return true;
  return BOT_USER_AGENT.test(value);
}

export function isPrefetch(signals: Pick<RequestSignals, "purpose" | "secPurpose" | "nextPrefetch">) {
  return signals.purpose.includes("prefetch")
    || signals.secPurpose.includes("prefetch")
    || signals.nextPrefetch === "1";
}

export function isAutomatedRequest(signals: RequestSignals) {
  return isBotUserAgent(signals.userAgent) || isPrefetch(signals);
}

export function readClientIp(headers: Headers) {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return "onbekend";
}

export function dailyVisitorHash(input: { salt: string; day: string; ip: string; userAgent: string }) {
  if (input.salt.trim().length < 16) {
    throw new Error("ANALYTICS_SALT is te kort");
  }
  return createHmac("sha256", input.salt)
    .update(`${input.day}\n${input.ip}\n${input.userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

const PAGE_PATH = /^\/[A-Za-z0-9/_-]*$/;

export function normalizePagePath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!PAGE_PATH.test(path) || path.length > 300) return null;
  if (path.includes("//") || path.includes("..")) return null;
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/auth")) return null;
  return path;
}

export type PageViewInsert = {
  path: string;
  day: string;
  visitor_hash: string;
};

export function buildPageView(input: {
  signals: RequestSignals;
  path: unknown;
  salt: string | undefined;
  ip: string;
  now: Date;
}): PageViewInsert | null {
  if (input.signals.method !== "POST") return null;
  if (isAutomatedRequest(input.signals)) return null;
  const site = input.signals.secFetchSite;
  if (site && site !== "same-origin" && site !== "none") return null;
  const path = normalizePagePath(input.path);
  const salt = input.salt?.trim() ?? "";
  if (!path || salt.length < 16) return null;
  const day = amsterdamDayKey(input.now);
  return {
    path,
    day,
    visitor_hash: dailyVisitorHash({
      salt,
      day,
      ip: input.ip,
      userAgent: input.signals.userAgent,
    }),
  };
}

export function shouldCountDownload(signals: RequestSignals) {
  return signals.method === "GET" && !isAutomatedRequest(signals);
}
