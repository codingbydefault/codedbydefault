export const PROJECT_STATUSES = ["in_ontwikkeling", "live", "niet_gestart", "gepauzeerd"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectCard = {
  slug: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  progress: number;
  url: string | null;
  sortOrder: number;
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  in_ontwikkeling: "In ontwikkeling",
  live: "Live",
  niet_gestart: "Nog niet gestart",
  gepauzeerd: "Gepauzeerd",
};

export const STARTER_PROJECTS: readonly ProjectCard[] = [
  {
    slug: "geregeldwerk",
    name: "Geregeldwerk",
    summary: "App voor terugkerend werk, planning en opvolging.",
    status: "in_ontwikkeling",
    progress: 45,
    url: null,
    sortOrder: 1,
  },
  {
    slug: "fodmap-tracker",
    name: "FODMAP-tracker",
    summary: "Registratietool voor voeding en FODMAP-aandachtspunten.",
    status: "in_ontwikkeling",
    progress: 40,
    url: null,
    sortOrder: 2,
  },
  {
    slug: "de-bumperbank",
    name: "De Bumperbank",
    summary: "Webshop.",
    status: "in_ontwikkeling",
    progress: 20,
    url: null,
    sortOrder: 3,
  },
  {
    slug: "automarktplaats",
    name: "Automarktplaats",
    summary: "Marktplaats voor auto's.",
    status: "niet_gestart",
    progress: 0,
    url: null,
    sortOrder: 4,
  },
  {
    slug: "custom-car-build",
    name: "Custom car build",
    summary: "Concept voor een custom car build.",
    status: "niet_gestart",
    progress: 0,
    url: null,
    sortOrder: 5,
  },
  {
    slug: "agent-app",
    name: "Agent-app",
    summary: "Concept voor een agent-app.",
    status: "niet_gestart",
    progress: 0,
    url: null,
    sortOrder: 6,
  },
];

export type ProjectUpdate = {
  slug: string;
  status: ProjectStatus;
  progress: number;
  url: string | null;
  summary: string;
};

export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.toString().length > 500) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseProjectUpdate(input: {
  slug: string;
  status: string;
  progress: string;
  url: string;
  summary: string;
}): { ok: true; value: ProjectUpdate } | { ok: false } {
  const slug = input.slug.trim();
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return { ok: false };
  if (!PROJECT_STATUSES.includes(input.status as ProjectStatus)) return { ok: false };
  if (!/^\d{1,3}$/.test(input.progress.trim())) return { ok: false };
  const progress = Number(input.progress.trim());
  if (progress > 100) return { ok: false };
  const summary = input.summary.trim().slice(0, 400);
  const urlText = input.url.trim();
  if (urlText && !safeHttpUrl(urlText)) return { ok: false };
  return {
    ok: true,
    value: {
      slug,
      status: input.status as ProjectStatus,
      progress,
      url: urlText ? safeHttpUrl(urlText) : null,
      summary,
    },
  };
}
