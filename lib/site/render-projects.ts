import { SITE_PROJECTS, SITE_UPDATES, type ProjectFeature, type SiteProject } from "../../content/site-projects";

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

function renderFeatures(features: readonly ProjectFeature[]) {
  return features
    .map((feature) => {
      const label = feature.state === "nu" ? "Nu" : "Binnenkort";
      const soon = feature.state === "binnenkort" ? " is-soon" : "";
      return `<li><span class="feature-state${soon}">${label}</span><p>${escapeHtml(feature.text)}</p></li>`;
    })
    .join("");
}

function renderVisual(project: SiteProject) {
  const visual = project.visual;
  if (visual.type === "screenshot") {
    return `<a class="project-visual is-screenshot" href="${escapeHtml(safeHttpUrl(project.href))}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt)}" width="${visual.width}" height="${visual.height}"></a>`;
  }
  return `<div class="project-visual is-logo"><img class="project-logo" src="${escapeHtml(visual.src)}" alt="${escapeHtml(visual.alt)}" width="${visual.width}" height="${visual.height}"></div>`;
}

function renderProject(project: SiteProject) {
  const title = project.title.map((line) => escapeHtml(line)).join("<br>");
  return `<article class="project project-${escapeHtml(project.slug)} reveal">
    <div class="project-top"><span class="project-status"><i></i> ${escapeHtml(project.status)}</span><span>${escapeHtml(project.index)} / ${escapeHtml(project.category)}</span></div>
    ${renderVisual(project)}
    <div class="project-copy">
      <div>
        <p>${escapeHtml(project.name)}</p>
        <h3>${title}</h3>
        <a class="project-link" href="${escapeHtml(safeHttpUrl(project.href))}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.hrefLabel)} <span aria-hidden="true">↗</span></a>
      </div>
      <div>
        <p>${escapeHtml(project.summary)}</p>
        <ul class="project-features">${renderFeatures(project.features)}</ul>
      </div>
    </div>
  </article>`;
}

export function renderSiteProjects() {
  const updates = SITE_UPDATES.map(
    (update) =>
      `<li><time>${escapeHtml(update.when)}</time><strong>${escapeHtml(update.project)}</strong><p>${escapeHtml(update.text)}</p></li>`,
  ).join("");

  return `<section id="projecten" class="projects">
    <div class="section-head reveal">
      <p class="kicker">/ 03 — Eigen producten</p>
      <h2>Gebouwd vanuit<br><span>de praktijk.</span></h2>
    </div>
    <div class="project-stage">
      ${SITE_PROJECTS.map(renderProject).join("\n")}
    </div>
    <div class="project-updates reveal">
      <p class="kicker">Laatste updates</p>
      <ol>${updates}</ol>
    </div>
    <p class="project-disclaimer reveal">Het Plainwork-beeld is een schermafbeelding van de publieke site. Fodmap Tracker en GeregeldWerk tonen hun eigen logo; ingelogde schermen zijn niet nagemaakt.</p>
  </section>`;
}
