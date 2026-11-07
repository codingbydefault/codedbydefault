import { conversionRate, fillVisitorSeries, sumVisitors, type MetricSet, type RecentRequest, type VisitorPoint } from "./metrics";
import type { ProjectCard } from "./projects";

export type DashboardModel = {
  generatedAt: string;
  hideTests: boolean;
  guides: MetricSet;
  quickscans: MetricSet;
  downloads: MetricSet;
  visitors: VisitorPoint[];
  pageviews30: number;
  conversion: {
    days7: { requests: number; visitors: number; rate: number | null };
    days30: { requests: number; visitors: number; rate: number | null };
  };
  requests: RecentRequest[];
  projects: ProjectCard[];
};

export function assembleDashboard(input: {
  now: Date;
  hideTests: boolean;
  guides: MetricSet;
  quickscans: MetricSet;
  downloads: MetricSet;
  visits: readonly VisitorPoint[];
  requests: RecentRequest[];
  projects: ProjectCard[];
}): DashboardModel {
  const visitors = fillVisitorSeries(input.visits, input.now, 30);
  const week = visitors.slice(-7);
  const requests7 = input.guides.days7 + input.quickscans.days7;
  const requests30 = input.guides.days30 + input.quickscans.days30;
  const visitors7 = sumVisitors(week);
  const visitors30 = sumVisitors(visitors);
  return {
    generatedAt: input.now.toISOString(),
    hideTests: input.hideTests,
    guides: input.guides,
    quickscans: input.quickscans,
    downloads: input.downloads,
    visitors,
    pageviews30: visitors.reduce((total, point) => total + point.pageviews, 0),
    conversion: {
      days7: { requests: requests7, visitors: visitors7, rate: conversionRate(requests7, visitors7) },
      days30: { requests: requests30, visitors: visitors30, rate: conversionRate(requests30, visitors30) },
    },
    requests: input.requests,
    projects: input.projects,
  };
}
