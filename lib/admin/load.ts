import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../supabase/admin";
import { type SiteSlug } from "../analytics/sites";
import { assembleDashboard, type DashboardModel } from "./model";
import { recentRequests, type MetricSet, type RecentRequest, type VisitorPoint } from "./metrics";
import { PROJECT_STATUSES, type ProjectCard, type ProjectStatus } from "./projects";
import { addCalendarDays, amsterdamDayKey, periodStarts } from "./time";

export type DashboardResult =
  | { ok: true; model: DashboardModel }
  | { ok: false; reason: "niet-geconfigureerd" | "migratie" | "onbekend" };

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
  return String(error);
}

function failureReason(error: unknown): "migratie" | "onbekend" {
  const message = errorMessage(error);
  if (/does not exist|schema cache|Could not find|PGRST|42P01|42883/i.test(message)) return "migratie";
  return "onbekend";
}

async function countRows(
  client: SupabaseClient,
  table: "guide_requests" | "quickscan_requests" | "guide_downloads",
  since: string | null,
  hideTests: boolean,
) {
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (since) query = query.gte("created_at", since);
  if (hideTests && table !== "guide_downloads") query = query.eq("is_test", false);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function metricSet(
  client: SupabaseClient,
  table: "guide_requests" | "quickscan_requests" | "guide_downloads",
  starts: { today: Date; days7: Date; days30: Date },
  hideTests: boolean,
): Promise<MetricSet> {
  const [total, today, days7, days30] = await Promise.all([
    countRows(client, table, null, hideTests),
    countRows(client, table, starts.today.toISOString(), hideTests),
    countRows(client, table, starts.days7.toISOString(), hideTests),
    countRows(client, table, starts.days30.toISOString(), hideTests),
  ]);
  return { total, today, days7, days30 };
}

function isStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

function asVisits(data: unknown): VisitorPoint[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const day = typeof record.day === "string" ? record.day.slice(0, 10) : null;
    if (!day) return [];
    const pageviews = Number(record.pageviews);
    const visitors = Number(record.visitors);
    return [{
      day,
      pageviews: Number.isFinite(pageviews) ? pageviews : 0,
      visitors: Number.isFinite(visitors) ? visitors : 0,
    }];
  });
}

function isMissingVisitScope(message: string) {
  return /admin_visit_scopes|schema cache|Could not find the function|PGRST202|42883/i.test(message);
}

async function loadVisitScopes(client: SupabaseClient, fromDay: string, selected: SiteSlug | "all") {
  const scoped = await client.rpc("admin_visit_scopes", { from_day: fromDay });
  if (!scoped.error) {
    const byScope = new Map<string, VisitorPoint[]>();
    for (const row of Array.isArray(scoped.data) ? scoped.data : []) {
      if (!row || typeof row !== "object") continue;
      const record = row as Record<string, unknown>;
      const scope = typeof record.scope === "string" ? record.scope : "";
      const point = asVisits([record])[0];
      if (!scope || !point) continue;
      const list = byScope.get(scope) ?? [];
      list.push(point);
      byScope.set(scope, list);
    }
    const selectedRows = byScope.get(selected) ?? [];
    const ownRows = byScope.get("codedbydefault") ?? [];
    return { siteSeries: byScope, visits: selectedRows, ownSiteVisitors: ownRows, visitsNotice: null };
  }
  if (!isMissingVisitScope(scoped.error.message)) throw new Error(scoped.error.message);

  const legacy = await client.rpc("admin_daily_visits", { from_day: fromDay });
  if (legacy.error) throw new Error(legacy.error.message);
  const rows = asVisits(legacy.data);
  const siteSeries = new Map<string, VisitorPoint[]>([
    ["all", rows],
    ["codedbydefault", rows],
  ]);
  return {
    siteSeries,
    visits: selected === "all" || selected === "codedbydefault" ? rows : [],
    ownSiteVisitors: rows,
    visitsNotice: "De telling per site staat aan nadat de nieuwe migratie is gedraaid. Tot die tijd zie je alleen CodedByDefault.",
  };
}

export async function loadDashboard(hideTests: boolean, selected: SiteSlug | "all" = "all", now = new Date()): Promise<DashboardResult> {
  const client = createAdminClient();
  if (!client) return { ok: false, reason: "niet-geconfigureerd" };

  try {
    const starts = periodStarts(now);
    const fromDay = addCalendarDays(amsterdamDayKey(now), -29);
    let guidesQuery = client
      .from("guide_requests")
      .select("request_id, created_at, name, email, is_test")
      .order("created_at", { ascending: false })
      .limit(20);
    let scansQuery = client
      .from("quickscan_requests")
      .select("request_id, created_at, name, email, website, is_test")
      .order("created_at", { ascending: false })
      .limit(20);
    if (hideTests) {
      guidesQuery = guidesQuery.eq("is_test", false);
      scansQuery = scansQuery.eq("is_test", false);
    }

    const [guides, quickscans, downloads, guideRows, scanRows, visitScopes, projectRows] = await Promise.all([
      metricSet(client, "guide_requests", starts, hideTests),
      metricSet(client, "quickscan_requests", starts, hideTests),
      metricSet(client, "guide_downloads", starts, false),
      guidesQuery,
      scansQuery,
      loadVisitScopes(client, fromDay, selected),
      client.from("projects").select("slug, name, summary, status, progress, url, sort_order").order("sort_order", { ascending: true }),
    ]);

    for (const result of [guideRows, scanRows, projectRows]) {
      if (result.error) throw new Error(result.error.message);
    }

    const requests: RecentRequest[] = [
      ...((guideRows.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.request_id),
        kind: "gids" as const,
        createdAt: String(row.created_at),
        name: String(row.name),
        email: String(row.email),
        detail: "CBD AI- & automatiseringsgids",
        isTest: Boolean(row.is_test),
      })),
      ...((scanRows.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.request_id),
        kind: "quickscan" as const,
        createdAt: String(row.created_at),
        name: String(row.name),
        email: String(row.email),
        detail: String(row.website ?? ""),
        isTest: Boolean(row.is_test),
      })),
    ];

    const projects: ProjectCard[] = ((projectRows.data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
      const status = String(row.status);
      if (!isStatus(status)) return [];
      const progress = Number(row.progress);
      return [{
        slug: String(row.slug),
        name: String(row.name),
        summary: String(row.summary ?? ""),
        status,
        progress: Number.isFinite(progress) ? progress : 0,
        url: typeof row.url === "string" ? row.url : null,
        sortOrder: Number(row.sort_order) || 0,
      }];
    });

    return {
      ok: true,
      model: assembleDashboard({
        now,
        hideTests,
        guides,
        quickscans,
        downloads,
        visits: visitScopes.visits,
        ownSiteVisitors: visitScopes.ownSiteVisitors,
        selectedSite: selected,
        siteSeries: visitScopes.siteSeries,
        visitsNotice: visitScopes.visitsNotice,
        requests: recentRequests(requests),
        projects,
      }),
    };
  } catch (error) {
    console.error("Dashboard laden mislukt");
    return { ok: false, reason: failureReason(error) };
  }
}
