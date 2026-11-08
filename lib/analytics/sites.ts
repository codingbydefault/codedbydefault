import { amsterdamDayKey } from "../admin/time";
import { dailyVisitorHash, isAutomatedRequest, type RequestSignals } from "./privacy";

export const SITE_SLUGS = ["codedbydefault", "fodmap", "bumperbank", "geregeldwerk"] as const;

export type SiteSlug = (typeof SITE_SLUGS)[number];

export const SITE_LABELS: Record<SiteSlug | "all", string> = {
  all: "Alle sites",
  codedbydefault: "CodedByDefault",
  fodmap: "FODMAP-tracker",
  bumperbank: "De Bumperbank",
  geregeldwerk: "Geregeldwerk",
};

const SITE_HOSTS: Record<SiteSlug, readonly string[]> = {
  codedbydefault: ["www.codedbydefault.com", "codedbydefault.com", "codedbydefault.vercel.app"],
  fodmap: ["www.fodmaptracker.eu", "fodmaptracker.eu", "fodmaptracker20.vercel.app"],
  bumperbank: ["www.debumperbank.nl", "debumperbank.nl", "dbb-tan.vercel.app"],
  geregeldwerk: [
    "geregeldwerk.vercel.app",
    "geregeldwerk.nl",
    "www.geregeldwerk.nl",
    "geregeldwerk.com",
    "www.geregeldwerk.com",
    "geregeldwerk.be",
    "www.geregeldwerk.be",
    "geregeldwerk.app",
    "www.geregeldwerk.app",
  ],
};

const STORED_PATH = /^\/[A-Za-z0-9/_-]*$/;
const MAX_BODY = 2048;
const MAX_REFERRER = 500;

export function isSiteSlug(value: string): value is SiteSlug {
  return (SITE_SLUGS as readonly string[]).includes(value);
}

export function parseSiteSelection(value: string | undefined | null): SiteSlug | "all" {
  if (!value || value === "all") return "all";
  return isSiteSlug(value) ? value : "all";
}

export function originHost(origin: string | null | undefined) {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return null;
    if (url.origin !== `https://${url.hostname}`) return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin: string | null | undefined) {
  const host = originHost(origin);
  if (!host) return false;
  return Object.values(SITE_HOSTS).some((hosts) => hosts.includes(host));
}

export function originAllowsSite(origin: string | null | undefined, site: string) {
  const host = originHost(origin);
  if (!host || !isSiteSlug(site)) return false;
  return SITE_HOSTS[site].includes(host);
}

export function corsHeaders(origin: string | null | undefined) {
  const headers: Record<string, string> = {
    "cache-control": "no-store",
    vary: "Origin",
  };
  if (origin && isAllowedOrigin(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
    headers["access-control-max-age"] = "86400";
  }
  return headers;
}

export function parseCollectBody(raw: string) {
  if (raw.length === 0 || raw.length > MAX_BODY) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function normalizeCollectPath(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  const withoutQuery = (trimmed.split("#")[0] ?? "").split("?")[0] ?? "";
  if (!STORED_PATH.test(withoutQuery) || withoutQuery.length > 300) return null;
  if (withoutQuery.includes("//") || withoutQuery.includes("..")) return null;
  return withoutQuery;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type CollectInsert = {
  site: SiteSlug;
  path: string;
  day: string;
  visitor_hash: string;
};

export function buildCollectRecord(input: {
  origin: string | null;
  body: unknown;
  signals: RequestSignals;
  salt: string | undefined;
  ip: string;
  now: Date;
}): CollectInsert | null {
  if (input.signals.method !== "POST") return null;
  if (isAutomatedRequest(input.signals)) return null;
  if (!isRecord(input.body)) return null;
  const site = typeof input.body.site === "string" ? input.body.site.trim() : "";
  if (!isSiteSlug(site) || !originAllowsSite(input.origin, site)) return null;
  if ("referrer" in input.body && input.body.referrer !== undefined && input.body.referrer !== null) {
    if (typeof input.body.referrer !== "string" || input.body.referrer.length > MAX_REFERRER) return null;
  }
  const path = normalizeCollectPath(input.body.path);
  const salt = input.salt?.trim() ?? "";
  if (!path || salt.length < 16) return null;
  const day = amsterdamDayKey(input.now);
  return {
    site,
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
