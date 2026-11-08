import { isTestRequest } from "./test-requests";
import { addCalendarDays, amsterdamDayKey, startOfAmsterdamDay } from "./time";
import { recentRequests, summarizeRows, type RecentRequest, type VisitorPoint } from "./metrics";
import { assembleDashboard } from "./model";
import { STARTER_PROJECTS } from "./projects";

type SampleLead = {
  daysAgo: number;
  hour: number;
  minute: number;
  kind: "gids" | "quickscan";
  name: string;
  email: string;
  detail: string;
};

const SAMPLE_LEADS: readonly SampleLead[] = [
  { daysAgo: 0, hour: 8, minute: 14, kind: "gids", name: "Sara de Vries", email: "sara@ateliernoord.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 0, hour: 9, minute: 5, kind: "quickscan", name: "Bram Hendriks", email: "bram@hendrikslogistiek.nl", detail: "https://hendrikslogistiek.nl" },
  { daysAgo: 0, hour: 10, minute: 41, kind: "gids", name: "Noor Bakker", email: "noor@studiohelder.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 1, hour: 11, minute: 2, kind: "gids", name: "Resend Test", email: "delivered@resend.dev", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 1, hour: 15, minute: 18, kind: "quickscan", name: "Milan Vos", email: "milan@voskoffie.nl", detail: "https://voskoffie.nl" },
  { daysAgo: 2, hour: 9, minute: 44, kind: "quickscan", name: "Test Gebruiker", email: "qa@example.com", detail: "https://example.com" },
  { daysAgo: 3, hour: 13, minute: 6, kind: "gids", name: "Fleur Ahmad", email: "fleur@studioahmad.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 5, hour: 10, minute: 12, kind: "gids", name: "Lotte Vermeer", email: "lotte@vermeerdruk.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 6, hour: 16, minute: 3, kind: "quickscan", name: "Yusuf Demir", email: "yusuf@demirinstallatie.nl", detail: "https://demirinstallatie.nl" },
  { daysAgo: 8, hour: 9, minute: 27, kind: "gids", name: "Eva Klein", email: "eva@kleinhoveniers.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 11, hour: 14, minute: 51, kind: "gids", name: "Thomas Berg", email: "thomas@bergadvies.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 12, hour: 8, minute: 36, kind: "quickscan", name: "Aisha El Idrissi", email: "aisha@atelieridris.nl", detail: "https://atelieridris.nl" },
  { daysAgo: 15, hour: 11, minute: 19, kind: "gids", name: "Joris Smit", email: "joris@smittransport.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 18, hour: 15, minute: 8, kind: "gids", name: "Hanna de Boer", email: "hanna@deboerzorg.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 21, hour: 10, minute: 55, kind: "quickscan", name: "Pieter Vos", email: "pieter@vosmakelaars.nl", detail: "https://vosmakelaars.nl" },
  { daysAgo: 24, hour: 9, minute: 4, kind: "gids", name: "Sofie Martens", email: "sofie@martensdesign.nl", detail: "CBD AI- & automatiseringsgids" },
  { daysAgo: 27, hour: 13, minute: 33, kind: "gids", name: "Daan Willems", email: "daan@willemsbouw.nl", detail: "CBD AI- & automatiseringsgids" },
];

function stamp(now: Date, daysAgo: number, hour: number, minute: number) {
  const day = addCalendarDays(amsterdamDayKey(now), -daysAgo);
  const time = startOfAmsterdamDay(day).getTime() + (hour * 60 + minute) * 60 * 1000;
  return new Date(Math.min(time, now.getTime() - 60_000)).toISOString();
}

export function createSampleVisits(now: Date): VisitorPoint[] {
  const end = amsterdamDayKey(now);
  return Array.from({ length: 30 }, (_, index) => {
    const day = addCalendarDays(end, -29 + index);
    const visitors = Math.max(8, Math.round(16 + index * 0.7 + 7 * Math.sin(index / 2.5)));
    const pageviews = Math.round(visitors * (1.35 + (index % 4) * 0.12));
    return { day, visitors, pageviews };
  });
}

export function createSampleDashboard(now: Date, hideTests: boolean) {
  const stamped = SAMPLE_LEADS.map((lead, index) => {
    const createdAt = stamp(now, lead.daysAgo, lead.hour, lead.minute);
    const isTest = isTestRequest(lead);
    return { ...lead, createdAt, isTest, id: `voorbeeld-${index + 1}` };
  });
  const visible = hideTests ? stamped.filter((lead) => !lead.isTest) : stamped;
  const guides = stamped.filter((lead) => lead.kind === "gids");
  const quickscans = stamped.filter((lead) => lead.kind === "quickscan");
  const downloads = guides
    .filter((lead) => !lead.isTest && Number(lead.id.replace("voorbeeld-", "")) % 3 !== 0)
    .map((lead) => ({ createdAt: lead.createdAt }));
  const requests: RecentRequest[] = visible.map((lead) => ({
    id: lead.id,
    kind: lead.kind,
    createdAt: lead.createdAt,
    name: lead.name,
    email: lead.email,
    detail: lead.detail,
    isTest: lead.isTest,
  }));

  return assembleDashboard({
    now,
    hideTests,
    guides: summarizeRows(guides, now, hideTests),
    quickscans: summarizeRows(quickscans, now, hideTests),
    downloads: summarizeRows(downloads, now, false),
    visits: createSampleVisits(now),
    requests: recentRequests(requests),
    projects: STARTER_PROJECTS.map((project) => ({ ...project })),
  });
}
