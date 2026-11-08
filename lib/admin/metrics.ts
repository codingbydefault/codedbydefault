import { addCalendarDays, amsterdamDayKey, periodStarts } from "./time";

export type MetricSet = {
  total: number;
  today: number;
  days7: number;
  days30: number;
};

export type VisitorPoint = {
  day: string;
  pageviews: number;
  visitors: number;
};

export type Countable = {
  createdAt: string;
  isTest?: boolean;
};

export function summarizeCounts(timestamps: readonly string[], now: Date): MetricSet {
  const starts = periodStarts(now);
  const metrics: MetricSet = { total: 0, today: 0, days7: 0, days30: 0 };
  for (const timestamp of timestamps) {
    const time = new Date(timestamp).getTime();
    if (Number.isNaN(time)) continue;
    metrics.total += 1;
    if (time >= starts.days30.getTime()) metrics.days30 += 1;
    if (time >= starts.days7.getTime()) metrics.days7 += 1;
    if (time >= starts.today.getTime()) metrics.today += 1;
  }
  return metrics;
}

export function summarizeRows(rows: readonly Countable[], now: Date, hideTests: boolean) {
  const relevant = hideTests ? rows.filter((row) => !row.isTest) : rows;
  return summarizeCounts(relevant.map((row) => row.createdAt), now);
}

export function fillVisitorSeries(rows: readonly VisitorPoint[], now: Date, days = 30): VisitorPoint[] {
  const end = amsterdamDayKey(now);
  const start = addCalendarDays(end, -(days - 1));
  const known = new Map(rows.map((row) => [row.day, row]));
  const series: VisitorPoint[] = [];
  let cursor = start;
  while (cursor <= end) {
    series.push(known.get(cursor) ?? { day: cursor, pageviews: 0, visitors: 0 });
    cursor = addCalendarDays(cursor, 1);
  }
  return series;
}

export function sumVisitors(series: readonly VisitorPoint[]) {
  return series.reduce((total, point) => total + point.visitors, 0);
}

export function summarizeVisitorSeries(series: readonly VisitorPoint[]) {
  const days30 = series.slice(-30);
  const today = series.at(-1);
  return {
    today: today?.visitors ?? 0,
    days7: sumVisitors(series.slice(-7)),
    days30: sumVisitors(days30),
    pageviews30: days30.reduce((total, point) => total + point.pageviews, 0),
  };
}

export function conversionRate(requests: number, visitors: number) {
  if (visitors <= 0) return null;
  return requests / visitors;
}

export type ConversionWindow = {
  requests: number;
  visitors: number;
  rate: number | null;
};

export type RecentRequest = {
  id: string;
  kind: "gids" | "quickscan";
  createdAt: string;
  name: string;
  email: string;
  detail: string;
  isTest: boolean;
};

export function recentRequests(rows: readonly RecentRequest[], limit = 12) {
  return [...rows]
    .sort((left, right) => {
      const delta = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      if (delta !== 0) return delta;
      return left.kind.localeCompare(right.kind);
    })
    .slice(0, limit);
}
