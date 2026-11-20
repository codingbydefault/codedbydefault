import { FEATURED_PROJECT, HOME_CARDS, type CatalogProject, type ProjectVisual } from "../../content/projects";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeHttpUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Projectlink moet http(s) zijn: ${value}`);
  }
  return url.toString();
}

const RESPONSIVE_RASTER: Record<string, { src: string; srcset: string; sizes: string; width: number; height: number }> = {
  "/projects/fodmap-logo.png": {
    src: "/projects/fodmap-logo-160.webp",
    srcset: "/projects/fodmap-logo-160.webp 160w, /projects/fodmap-logo-240.webp 240w",
    sizes: "132px",
    width: 160,
    height: 160,
  },
  "/projects/geregeldwerk-logo-transparant.png": {
    src: "/projects/geregeldwerk-logo-320.webp",
    srcset: "/projects/geregeldwerk-logo-320.webp 320w, /projects/geregeldwerk-logo-480.webp 480w",
    sizes: "(max-width: 600px) 260px, 280px",
    width: 320,
    height: 79,
  },
  "/projects/plainwork-home.jpg": {
    src: "/projects/plainwork-home-480.webp",
    srcset: "/projects/plainwork-home-480.webp 480w, /projects/plainwork-home-640.webp 640w",
    sizes: "(min-width: 1180px) 420px, (min-width: 800px) 46vw, calc(100vw - 40px)",
    width: 480,
    height: 287,
  },
};

function renderRaster(visual: { src: string; alt: string; width: number; height: number }, className?: string) {
  const sized = RESPONSIVE_RASTER[visual.src];
  const src = sized?.src ?? visual.src;
  const width = sized?.width ?? visual.width;
  const height = sized?.height ?? visual.height;
  const classAttr = className ? ` class="${className}"` : "";
  const responsive = sized
    ? ` srcset="${escapeHtml(sized.srcset)}" sizes="${escapeHtml(sized.sizes)}"`
    : "";
  return `<img${classAttr} src="${escapeHtml(src)}"${responsive} alt="${escapeHtml(visual.alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;
}

function renderVisual(project: CatalogProject) {
  const visual: ProjectVisual = project.visual;
  if (visual.type === "logo") {
    return `<div class="project-visual is-logo">${renderRaster(visual, "project-logo")}</div>`;
  }
  if (visual.type === "screenshot") {
    const href = project.url ? safeHttpUrl(project.url) : "";
    const image = renderRaster(visual);
    if (!href) return `<div class="project-visual is-screenshot">${image}</div>`;
    return `<a class="project-visual is-screenshot" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${image}</a>`;
  }
  if (visual.type === "tag") {
    return `<div class="project-visual is-tag" aria-hidden="true"><span class="tag-hole"></span><p class="tag-mark">${escapeHtml(visual.mark)}</p><p class="tag-sub">${escapeHtml(visual.subtitle)}</p></div>`;
  }
  return `<div class="project-visual is-initials" aria-hidden="true"><span>${escapeHtml(visual.letters)}</span></div>`;
}

function renderCard(project: CatalogProject) {
  const href = project.url
    ? `<a class="project-link" href="${escapeHtml(safeHttpUrl(project.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.hrefLabel ?? "Open project")} <span aria-hidden="true">↗</span></a>`
    : `<p class="project-pending">Nog geen link</p>`;
  return `<article class="project project-${escapeHtml(project.slug)} reveal">
    <div class="project-top"><span class="project-status"><i></i> ${escapeHtml(project.publicLabel)}</span></div>
    ${renderVisual(project)}
    <div class="project-copy">
      <p>${escapeHtml(project.name)}</p>
      <h3>${escapeHtml(project.cardTitle)}</h3>
      <p>${escapeHtml(project.summary)}</p>
      ${href}
    </div>
  </article>`;
}

export function renderFeaturedProject() {
  const project = FEATURED_PROJECT;
  if (!project?.url || !project.hrefLabel) {
    throw new Error("DefaultStackr mist een publieke link.");
  }
  const href = safeHttpUrl(project.url);
  return `<section id="defaultstackr" class="stackr" aria-labelledby="defaultstackr-title">
    <div class="stackr-ambient a" aria-hidden="true"></div>
    <div class="stackr-ambient b" aria-hidden="true"></div>
    <div class="stackr-inner">
      <p class="stackr-brand">
        <span class="stackr-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="stackr-word">Default<span>Stackr</span><small>by CodedByDefault</small></span>
      </p>
      <p class="stackr-kicker"><b class="stackr-dot" aria-hidden="true"></b> ${escapeHtml(project.publicLabel)}</p>
      <h1 id="defaultstackr-title">Build. Deploy. <em>Scale.</em></h1>
      <p class="stackr-line">Your entire stack. One platform.</p>
      <p class="stackr-lead">${escapeHtml(project.summary)}</p>
      <a class="stackr-cta" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.hrefLabel)} <span aria-hidden="true">↗</span></a>
      <ul class="stackr-points" aria-label="Wat er nu van DefaultStackr bekend is">
        <li>PostgreSQL in de testomgeving</li>
        <li>Interface in ontwikkeling</li>
        <li>Hostingkoppeling gepland</li>
      </ul>
    </div>
  </section>`;
}

export function renderProjectSection() {
  return `<section id="projecten" class="projects">
    <div class="section-head reveal">
      <p class="kicker">Andere projecten</p>
      <h2>Ook van ons.<br><span>Elk in zijn eigen fase.</span></h2>
    </div>
    <div class="project-stage">
      ${HOME_CARDS.map(renderCard).join("\n")}
    </div>
    <p class="project-disclaimer reveal">Logo's komen van de projecten zelf. BUMPR heeft nog geen webshoplink. Het Plainwork-beeld is een schermafbeelding van de publieke homepage.</p>
  </section>`;
}
