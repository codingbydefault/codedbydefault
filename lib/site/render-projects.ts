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

function renderVisual(project: CatalogProject) {
  const visual: ProjectVisual = project.visual;
  if (visual.type === "logo") {
    return `<div class="project-visual is-logo"><img class="project-logo" src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt)}" width="${visual.width}" height="${visual.height}"></div>`;
  }
  if (visual.type === "screenshot") {
    const href = project.url ? safeHttpUrl(project.url) : "";
    const image = `<img src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt)}" width="${visual.width}" height="${visual.height}">`;
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
