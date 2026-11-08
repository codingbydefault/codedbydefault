import { SITE_LABELS, SITE_SLUGS, type SiteSlug } from "../analytics/sites";
import { conversionRate, fillVisitorSeries, summarizeVisitorSeries, sumVisitors, type MetricSet, type RecentRequest, type VisitorPoint } from "./metrics";
import type { ProjectCard } from "./projects";

export type SiteVisitSummary = {
  site: SiteSlug | "all";
  label: string;
  today: number;
  days7: number;
  days30: number;
  pageviews30: number;
};

export type DashboardModel = {
  generatedAt: string;
  hideTests: boolean;
  guides: MetricSet;
  quickscans: MetricSet;
  downloads: MetricSet;
  visitors: VisitorPoint[];
  pageviews30: number;
  selectedSite: SiteSlug | "all";
  siteSummaries: SiteVisitSummary[];
  visitsNotice: string | null;
  conversion: {
    days7: { requests: number; visitors: number; rate: number | null };
    days30: { requests: number; visitors: number; rate: number | null };
  };
  requests: RecentRequest[];
  projects: ProjectCard[];
};

export function siteSummariesFrom(seriesByScope: ReadonlyMap<string, readonly VisitorPoint[]>, now: Date): SiteVisitSummary[] {
  const scopes = ["all", ...SITE_SLUGS] as const;
  return scopes.map((site) => {
    const series = fillVisitorSeries(seriesByScope.get(site) ?? [], now, 30);
    return { site, label: SITE_LABELS[site], ...summarizeVisitorSeries(series) };
  });
}

export function assembleDashboard(input: {
  now: Date;
  hideTests: boolean;
  guides: MetricSet;
  quickscans: MetricSet;
  downloads: MetricSet;
  visits: readonly VisitorPoint[];
  requests: RecentRequest[];
  projects: ProjectCard[];
  selectedSite?: SiteSlug | "all";
  siteSeries?: ReadonlyMap<string, readonly VisitorPoint[]>;
  ownSiteVisitors?: readonly VisitorPoint[];
  visitsNotice?: string | null;
}): DashboardModel {
  const visitors = fillVisitorSeries(input.visits, input.now, 30);
  const ownSite = fillVisitorSeries(input.ownSiteVisitors ?? input.visits, input.now, 30);
  const ownWeek = ownSite.slice(-7);
  const requests7 = input.guides.days7 + input.quickscans.days7;
  const requests30 = input.guides.days30 + input.quickscans.days30;
  const visitors7 = sumVisitors(ownWeek);
  const visitors30 = sumVisitors(ownSite);
  const selectedSite = input.selectedSite ?? "all";
  const siteSummaries = input.siteSeries
    ? siteSummariesFrom(input.siteSeries, input.now)
    : siteSummariesFrom(new Map([["all", visitors], ["codedbydefault", ownSite]]), input.now);
  return {
    generatedAt: input.now.toISOString(),
    hideTests: input.hideTests,
    guides: input.guides,
    quickscans: input.quickscans,
    downloads: input.downloads,
    visitors,
    pageviews30: visitors.reduce((total, point) => total + point.pageviews, 0),
    selectedSite,
    siteSummaries,
    visitsNotice: input.visitsNotice ?? null,
    conversion: {
      days7: { requests: requests7, visitors: visitors7, rate: conversionRate(requests7, visitors7) },
      days30: { requests: requests30, visitors: visitors30, rate: conversionRate(requests30, visitors30) },
    },
    requests: input.requests,
    projects: input.projects,
  };
}
