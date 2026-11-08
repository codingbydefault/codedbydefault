import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRateLimiter } from "../lib/analytics/rate-limit";
import { signalsFromHeaders } from "../lib/analytics/privacy";
import {
  buildCollectRecord,
  corsHeaders,
  isAllowedOrigin,
  normalizeCollectPath,
  originAllowsSite,
  parseCollectBody,
  parseSiteSelection,
} from "../lib/analytics/sites";
import { summarizeVisitorSeries } from "../lib/admin/metrics";
import { createSampleDashboard, createSampleSiteSeries } from "../lib/admin/sample";

const SALT = "dit-is-een-lange-test-salt";
const NOW = new Date("2026-11-07T11:13:00.000Z");

function signals(userAgent = "Mozilla/5.0 Chrome/120") {
  return signalsFromHeaders("POST", new Headers({ "user-agent": userAgent }));
}

test("een site telt alleen vanaf een bijbehorende origin", () => {
  assert.equal(originAllowsSite("https://www.fodmaptracker.eu", "fodmap"), true);
  assert.equal(originAllowsSite("https://fodmaptracker.eu", "fodmap"), true);
  assert.equal(originAllowsSite("https://fodmaptracker20.vercel.app", "fodmap"), true);
  assert.equal(originAllowsSite("https://www.fodmaptracker.eu", "bumperbank"), false);
  assert.equal(originAllowsSite("https://www.debumperbank.nl", "bumperbank"), true);
  assert.equal(originAllowsSite("https://dbb-tan.vercel.app", "bumperbank"), true);
  assert.equal(originAllowsSite("https://geregeldwerk.vercel.app", "geregeldwerk"), true);
  assert.equal(originAllowsSite("https://www.geregeldwerk.be", "geregeldwerk"), true);
  assert.equal(originAllowsSite("https://geregeldwerk.app", "geregeldwerk"), true);
  assert.equal(originAllowsSite("https://codedbydefault.com", "codedbydefault"), true);
  assert.equal(originAllowsSite("https://www.codedbydefault.com", "codedbydefault"), true);
  assert.equal(originAllowsSite("https://codedbydefault.vercel.app", "codedbydefault"), true);
  assert.equal(originAllowsSite("http://www.fodmaptracker.eu", "fodmap"), false);
  assert.equal(originAllowsSite("https://evil.example", "fodmap"), false);
  assert.equal(originAllowsSite(null, "fodmap"), false);
  assert.equal(isAllowedOrigin("https://www.geregeldwerk.nl"), true);
  assert.equal(isAllowedOrigin("https://niet-toegestaan.example"), false);
});

test("het verzamelverzoek bewaart site, pad, dag en hash", () => {
  const raw = JSON.stringify({
    site: "fodmap",
    path: "/week?utm=1#menu",
    referrer: "https://www.google.com/search",
    ip: "203.0.113.10",
  });
  const row = buildCollectRecord({
    origin: "https://www.fodmaptracker.eu",
    body: parseCollectBody(raw),
    signals: signals(),
    salt: SALT,
    ip: "203.0.113.10",
    now: NOW,
  });
  assert.deepEqual(Object.keys(row ?? {}).sort(), ["day", "path", "site", "visitor_hash"]);
  assert.equal(row?.site, "fodmap");
  assert.equal(row?.path, "/week");
  assert.equal(row?.day, "2026-11-07");
  assert.equal(JSON.stringify(row).includes("203.0.113.10"), false);
  assert.equal(JSON.stringify(row).includes("google"), false);
  assert.equal(normalizeCollectPath("/pad"), "/pad");
  assert.equal(normalizeCollectPath("/../geheim"), null);
  assert.equal(buildCollectRecord({
    origin: "https://www.debumperbank.nl",
    body: { site: "fodmap", path: "/" },
    signals: signals(),
    salt: SALT,
    ip: "203.0.113.10",
    now: NOW,
  }), null);
  assert.equal(buildCollectRecord({
    origin: "https://www.fodmaptracker.eu",
    body: { site: "fodmap", path: "/", referrer: "x".repeat(501) },
    signals: signals(),
    salt: SALT,
    ip: "203.0.113.10",
    now: NOW,
  }), null);
  assert.equal(buildCollectRecord({
    origin: "https://www.fodmaptracker.eu",
    body: parseCollectBody("geen json"),
    signals: signals(),
    salt: SALT,
    ip: "203.0.113.10",
    now: NOW,
  }), null);
  assert.equal(parseCollectBody("x".repeat(2049)), null);
  assert.equal(buildCollectRecord({
    origin: "https://www.fodmaptracker.eu",
    body: { site: "fodmap", path: "/" },
    signals: signals("Googlebot/2.1"),
    salt: SALT,
    ip: "203.0.113.10",
    now: NOW,
  }), null);
});

test("cors geldt alleen voor de afgesproken origins", () => {
  const allowed = corsHeaders("https://dbb-tan.vercel.app");
  assert.equal(allowed["access-control-allow-origin"], "https://dbb-tan.vercel.app");
  assert.match(allowed["access-control-allow-methods"], /POST/);
  assert.equal(corsHeaders("https://evil.example")["access-control-allow-origin"], undefined);
  assert.equal(corsHeaders(null)["access-control-allow-origin"], undefined);
  assert.equal(parseSiteSelection("fodmap"), "fodmap");
  assert.equal(parseSiteSelection("anders"), "all");
});

test("de rate-limit stopt een herhaling en de totalen zijn geen som van de sites", () => {
  const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(allow("hash", 0), true);
  assert.equal(allow("hash", 10), true);
  assert.equal(allow("hash", 20), false);
  assert.equal(allow("hash", 2000), true);

  const sites = createSampleSiteSeries(NOW);
  const last = sites.all.at(-1);
  const sum = sites.codedbydefault.at(-1)!.visitors
    + sites.fodmap.at(-1)!.visitors
    + sites.bumperbank.at(-1)!.visitors
    + sites.geregeldwerk.at(-1)!.visitors;
  assert.ok(last);
  assert.ok(last.visitors < sum);
  assert.ok(last.visitors >= sites.codedbydefault.at(-1)!.visitors);
  const summary = summarizeVisitorSeries(sites.fodmap);
  assert.equal(summary.today, sites.fodmap.at(-1)?.visitors);
  assert.equal(summary.days30 >= summary.days7, true);

  const dashboard = createSampleDashboard(NOW, true, "bumperbank");
  assert.equal(dashboard.selectedSite, "bumperbank");
  assert.equal(dashboard.siteSummaries.length, 5);
  assert.equal(dashboard.siteSummaries[0]?.site, "all");
  assert.ok(dashboard.conversion.days30.visitors > 0);
});

test("de nieuwe migratie voegt alleen een sitekolom toe", () => {
  const sql = fs.readFileSync("supabase/migrations/20261108091833_site_visits.sql", "utf8");
  assert.match(sql, /add column if not exists site text not null default 'codedbydefault'/);
  assert.match(sql, /codedbydefault', 'fodmap', 'bumperbank', 'geregeldwerk'/);
  assert.match(sql, /create or replace function public\.admin_visit_scopes/);
  assert.match(sql, /p\.site = 'codedbydefault'/);
  assert.equal(sql.toLowerCase().includes("drop table"), false);
  assert.equal(sql.toLowerCase().includes("delete from"), false);
  assert.equal(sql.toLowerCase().includes("disable row level security"), false);
  assert.match(sql, /grant execute on function public\.admin_visit_scopes\(date\) to service_role/);
});
