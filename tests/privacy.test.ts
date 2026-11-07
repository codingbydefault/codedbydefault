import assert from "node:assert/strict";
import test from "node:test";
import { buildPageView, dailyVisitorHash, isBotUserAgent, normalizePagePath, readClientIp, shouldCountDownload, signalsFromHeaders } from "../lib/analytics/privacy";
import { persistPageView } from "../lib/analytics/persist";

const SALT = "dit-is-een-lange-test-salt";
const NOW = new Date("2026-11-07T11:13:00.000Z");

function signals(overrides: Partial<ReturnType<typeof signalsFromHeaders>> = {}) {
  return {
    method: "GET",
    userAgent: "Mozilla/5.0 Chrome/120",
    purpose: "",
    secPurpose: "",
    secFetchSite: "same-origin",
    nextPrefetch: "",
    ...overrides,
  };
}

test("dagelijkse hash verandert per dag en bevat het IP niet", () => {
  const ip = "203.0.113.55";
  const first = dailyVisitorHash({ salt: SALT, day: "2026-11-07", ip, userAgent: "Chrome" });
  const second = dailyVisitorHash({ salt: SALT, day: "2026-11-08", ip, userAgent: "Chrome" });
  const otherIp = dailyVisitorHash({ salt: SALT, day: "2026-11-07", ip: "203.0.113.56", userAgent: "Chrome" });
  const otherSalt = dailyVisitorHash({ salt: `${SALT}-anders`, day: "2026-11-07", ip, userAgent: "Chrome" });
  assert.equal(first, dailyVisitorHash({ salt: SALT, day: "2026-11-07", ip, userAgent: "Chrome" }));
  assert.notEqual(first, second);
  assert.notEqual(first, otherIp);
  assert.notEqual(first, otherSalt);
  assert.match(first, /^[0-9a-f]{32}$/);
  assert.equal(first.includes(ip), false);
  assert.equal(first.includes("203.0.113"), false);
});

test("een te korte salt wordt geweigerd", () => {
  assert.throws(() => dailyVisitorHash({ salt: "kort", day: "2026-11-07", ip: "203.0.113.10", userAgent: "Chrome" }));
});

test("bots, lege user-agents en prefetch tellen niet mee", () => {
  assert.equal(isBotUserAgent(""), true);
  assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBotUserAgent("curl/8.0"), true);
  assert.equal(isBotUserAgent("Mozilla/5.0 Chrome/120"), false);
  assert.equal(shouldCountDownload(signals()), true);
  assert.equal(shouldCountDownload(signals({ method: "HEAD" })), false);
  assert.equal(shouldCountDownload(signals({ userAgent: "Slackbot-LinkExpanding 1.0" })), false);
  assert.equal(shouldCountDownload(signals({ purpose: "prefetch" })), false);
  assert.equal(shouldCountDownload(signals({ secPurpose: "prefetch" })), false);
  assert.equal(shouldCountDownload(signals({ nextPrefetch: "1" })), false);
});

test("een paginaweergave bewaart alleen pad, dag en hash", () => {
  const row = buildPageView({
    signals: signals({ method: "POST" }),
    path: "/#gids",
    salt: SALT,
    ip: "203.0.113.55",
    now: NOW,
  });
  assert.equal(row, null);

  const stored = buildPageView({
    signals: signals({ method: "POST" }),
    path: "/",
    salt: SALT,
    ip: "203.0.113.55",
    now: NOW,
  });
  assert.deepEqual(Object.keys(stored ?? {}).sort(), ["day", "path", "visitor_hash"]);
  assert.equal(stored?.path, "/");
  assert.equal(stored?.day, "2026-11-07");
  assert.equal(JSON.stringify(stored).includes("203.0.113.55"), false);
  assert.equal(buildPageView({
    signals: signals({ method: "POST", secFetchSite: "cross-site" }),
    path: "/",
    salt: SALT,
    ip: "203.0.113.55",
    now: NOW,
  }), null);
  assert.equal(buildPageView({
    signals: signals({ method: "POST", userAgent: "Googlebot" }),
    path: "/",
    salt: SALT,
    ip: "203.0.113.55",
    now: NOW,
  }), null);
  assert.equal(normalizePagePath("/admin"), null);
  assert.equal(normalizePagePath("/../etc/passwd"), null);
  assert.equal(normalizePagePath("/gids"), "/gids");
});

test("het IP wordt alleen uit het eerste doorstuuradres gelezen", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.8", "x-real-ip": "198.51.100.20" });
  assert.equal(readClientIp(headers), "198.51.100.20");
  assert.equal(readClientIp(new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.8" })), "203.0.113.10");
});

test("een paginaweergave wordt overgeslagen zonder schrijver of bij een bot", async () => {
  const calls: unknown[] = [];
  const skipped = await persistPageView(null, {
    path: "/",
    day: "2026-11-07",
    visitor_hash: "a".repeat(32),
  });
  assert.deepEqual(skipped, { ok: true, skipped: true });
  const stored = await persistPageView({
    async insertPageView(row) {
      calls.push(row);
      return null;
    },
  }, null);
  assert.deepEqual(stored, { ok: true, skipped: true });
  assert.deepEqual(calls, []);
});

test("headers worden tot signalen genormaliseerd", () => {
  const headers = new Headers({
    "user-agent": " Chrome ",
    purpose: "prefetch",
    "sec-fetch-site": "same-origin",
    "next-router-prefetch": "1",
  });
  assert.deepEqual(signalsFromHeaders("post", headers), {
    method: "POST",
    userAgent: "Chrome",
    purpose: "prefetch",
    secPurpose: "",
    secFetchSite: "same-origin",
    nextPrefetch: "1",
  });
});
