import { CATALOG_PROJECTS, PROJECT_STATUSES, type ProjectStatus } from "../../content/projects";

export { PROJECT_STATUSES, type ProjectStatus };

export type ProjectCard = {
  slug: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  progress: number;
  url: string | null;
  sortOrder: number;
  featured: boolean;
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  in_ontwikkeling: "In ontwikkeling",
  live: "Live",
  niet_gestart: "Nog niet gestart",
  gepauzeerd: "Gepauzeerd",
};

export const STARTER_PROJECTS: readonly ProjectCard[] = CATALOG_PROJECTS.map((project) => ({
  slug: project.slug,
  name: project.name,
  summary: project.summary,
  status: project.status,
  progress: project.progress,
  url: project.url,
  sortOrder: project.sortOrder,
  featured: project.featured,
}));

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
