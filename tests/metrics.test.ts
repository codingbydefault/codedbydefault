import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isAllowlisted, parseAllowlist } from "../lib/admin/allowlist";
import { assembleDashboard } from "../lib/admin/model";
import { conversionRate, fillVisitorSeries, recentRequests, summarizeCounts, summarizeRows } from "../lib/admin/metrics";
import { parseProjectUpdate, STARTER_PROJECTS } from "../lib/admin/projects";
import { createSampleDashboard } from "../lib/admin/sample";
import { isTestRequest } from "../lib/admin/test-requests";
import { amsterdamDayKey, periodStarts, startOfAmsterdamDay } from "../lib/admin/time";

const migration = fs.readFileSync("supabase/migrations/20261107112115_admin_dashboard.sql", "utf8");

test("Amsterdamse daggrenzen volgen zomer- en wintertijd", () => {
  assert.equal(amsterdamDayKey(new Date("2026-01-15T23:30:00.000Z")), "2026-01-16");
  assert.equal(amsterdamDayKey(new Date("2026-07-15T21:30:00.000Z")), "2026-07-15");
  assert.equal(startOfAmsterdamDay("2026-01-16").toISOString(), "2026-01-15T23:00:00.000Z");
  assert.equal(startOfAmsterdamDay("2026-07-16").toISOString(), "2026-07-15T22:00:00.000Z");
  assert.equal(startOfAmsterdamDay("2026-03-29").toISOString(), "2026-03-28T23:00:00.000Z");
  assert.equal(startOfAmsterdamDay("2026-10-25").toISOString(), "2026-10-24T22:00:00.000Z");
});

test("totalen, vandaag, zeven en dertig dagen sluiten op de daggrens", () => {
  const now = new Date("2026-11-07T11:13:00.000Z");
  const starts = periodStarts(now);
  const justBeforeToday = new Date(starts.today.getTime() - 1).toISOString();
  const counts = summarizeCounts([
    "2026-01-01T12:00:00.000Z",
    justBeforeToday,
    starts.today.toISOString(),
    now.toISOString(),
  ], now);
  assert.deepEqual(counts, { total: 4, today: 2, days7: 3, days30: 3 });
  const hidden = summarizeRows([
    { createdAt: now.toISOString(), isTest: false },
    { createdAt: now.toISOString(), isTest: true },
  ], now, true);
  assert.equal(hidden.today, 1);
});

test("bezoekersreeks en conversie", () => {
  const now = new Date("2026-11-07T11:13:00.000Z");
  const series = fillVisitorSeries([
    { day: "2026-11-07", pageviews: 4, visitors: 2 },
    { day: "2026-11-06", pageviews: 2, visitors: 2 },
  ], now, 30);
  assert.equal(series.length, 30);
  assert.equal(series[0]?.day, "2026-10-09");
  assert.equal(series.at(-1)?.visitors, 2);
  assert.equal(series[0]?.visitors, 0);
  assert.equal(conversionRate(1, 4), 0.25);
  assert.equal(conversionRate(1, 0), null);

  const model = assembleDashboard({
    now,
    hideTests: true,
    guides: { total: 2, today: 1, days7: 2, days30: 2 },
    quickscans: { total: 1, today: 0, days7: 0, days30: 1 },
    downloads: { total: 1, today: 0, days7: 1, days30: 1 },
    visits: series,
    requests: [],
    projects: [],
  });
  assert.equal(model.conversion.days7.requests, 2);
  assert.equal(model.visitors.length, 30);
});

test("testaanvragen en de beheerlijst", () => {
  assert.equal(isTestRequest({ name: "Sara", email: "delivered@resend.dev" }), true);
  assert.equal(isTestRequest({ name: "Test Gebruiker", email: "sara@bedrijf.nl" }), true);
  assert.equal(isTestRequest({ name: "Sara de Vries", email: "sara@bedrijf.nl" }), false);
  assert.match(migration, /like '%@resend\.dev'/);
  assert.match(migration, /position\('test' in lower\(name\)\)/);
  assert.deepEqual(parseAllowlist(" Sara@Bedrijf.nl, ongeldig, sara@bedrijf.nl "), ["sara@bedrijf.nl"]);
  assert.equal(isAllowlisted("sara@bedrijf.nl", []), false);
  assert.equal(isAllowlisted("sara@bedrijf.nl", ["sara@bedrijf.nl"]), true);
});

test("projectwijzigingen blijven binnen status, voortgang en http-link", () => {
  const ok = parseProjectUpdate({
    slug: "geregeldwerk",
    status: "live",
    progress: "80",
    url: "https://geregeldwerk.nl",
    summary: "Bijgewerkt",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.url, "https://geregeldwerk.nl/");
  assert.equal(parseProjectUpdate({ slug: "geregeldwerk", status: "live", progress: "101", url: "", summary: "" }).ok, false);
  assert.equal(parseProjectUpdate({ slug: "geregeldwerk", status: "live", progress: "10.5", url: "", summary: "" }).ok, false);
  assert.equal(parseProjectUpdate({ slug: "geregeldwerk", status: "anders", progress: "10", url: "", summary: "" }).ok, false);
  assert.equal(parseProjectUpdate({ slug: "geregeldwerk", status: "live", progress: "10", url: "javascript:alert(1)", summary: "" }).ok, false);
});

test("de migratie zet RLS aan en seedt de projecten", () => {
  for (const table of ["admin_allowlist", "guide_requests", "quickscan_requests", "guide_downloads", "page_views", "projects"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`alter table public\\.${table} force row level security`));
  }
  assert.match(migration, /revoke all on table public\.guide_requests from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.admin_daily_visits\(date\) to service_role/);
  assert.match(migration, /grant execute on function app_private\.touch_updated_at\(\) to authenticated, service_role/);
  assert.equal(migration.includes("security definer"), true);
  assert.equal(migration.includes("create or replace function public.admin_daily_visits"), true);
  for (const project of STARTER_PROJECTS) {
    const line = migration.split("\n").find((entry) => entry.includes(`'${project.slug}'`));
    assert.ok(line, project.slug);
    assert.match(line ?? "", new RegExp(`'${project.status}'`));
    assert.match(line ?? "", new RegExp(`, ${project.progress},`));
  }
  const names = recentRequests([
    { id: "1", kind: "quickscan", createdAt: "2026-11-07T10:00:00.000Z", name: "A", email: "a@b.nl", detail: "https://b.nl", isTest: false },
    { id: "2", kind: "gids", createdAt: "2026-11-07T11:00:00.000Z", name: "B", email: "b@b.nl", detail: "gids", isTest: false },
  ]).map((row) => row.name);
  assert.deepEqual(names, ["B", "A"]);
});

test("voorbeelddata verbergt testaanvragen en houdt de zes projecten", () => {
  const now = new Date("2026-11-07T11:13:00.000Z");
  const hidden = createSampleDashboard(now, true);
  const shown = createSampleDashboard(now, false);
  assert.equal(hidden.projects.length, 6);
  assert.equal(hidden.projects[0]?.name, "Geregeldwerk");
  assert.equal(hidden.projects[3]?.status, "niet_gestart");
  assert.ok(hidden.guides.total < shown.guides.total);
  assert.equal(hidden.requests.some((row) => row.email === "delivered@resend.dev"), false);
  assert.equal(shown.requests.some((row) => row.isTest), true);
  assert.equal(hidden.visitors.length, 30);
  assert.ok((hidden.conversion.days30.rate ?? 0) > 0);
});
