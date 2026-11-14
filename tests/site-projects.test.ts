import assert from "node:assert/strict";
import test from "node:test";
import { SITE_PROJECTS, SITE_UPDATES } from "../content/site-projects";
import { renderSiteProjects } from "../lib/site/render-projects";

test("de homepage noemt de drie publieke producten en houdt de bestaande", () => {
  assert.deepEqual(
    SITE_PROJECTS.map((project) => project.slug),
    ["plainwork-studio", "geregeldwerk", "fodmap-tracker"],
  );
  for (const project of SITE_PROJECTS) {
    assert.match(project.href, /^https:\/\//);
    assert.ok(project.features.some((feature) => feature.state === "nu"));
  }
});

test("live functies blijven gescheiden van wat nog binnenkort is", () => {
  const liveText = SITE_PROJECTS.flatMap((project) =>
    project.features.filter((feature) => feature.state === "nu").map((feature) => feature.text),
  )
    .join(" ")
    .toLowerCase();
  assert.equal(liveText.includes("whatsapp"), false);
  assert.equal(liveText.includes("gbp"), false);
  assert.equal(liveText.includes("meertal"), false);
  assert.equal(liveText.includes("peppol"), false);

  const geregeldwerk = SITE_PROJECTS.find((project) => project.slug === "geregeldwerk");
  assert.ok(geregeldwerk);
  assert.match(geregeldwerk.summary, /wachtlijst/i);
  assert.match(geregeldwerk.features.map((feature) => feature.text).join(" "), /29,95/);
  assert.equal(geregeldwerk.visual.type, "logo");
  if (geregeldwerk.visual.type === "logo") {
    assert.equal(geregeldwerk.visual.src, "/projects/geregeldwerk-logo-transparant.png");
  }

  const fodmap = SITE_PROJECTS.find((project) => project.slug === "fodmap-tracker");
  assert.ok(fodmap);
  assert.equal(fodmap.visual.type, "logo");
  assert.match(fodmap.summary, /geen medisch advies/i);
  assert.match(fodmap.summary, /geen gevalideerde FODMAP-classificaties/i);
});

test("de projectsectie rendert logos, de schermafbeelding en de updates", () => {
  const html = renderSiteProjects();
  assert.match(html, /id="projecten"/);
  assert.match(html, /geregeldwerk-logo-transparant\.png/);
  assert.equal(html.includes("geregeldwerk-icoon.png"), false);
  assert.match(html, /fodmap-logo\.png/);
  assert.match(html, /plainwork-home\.jpg/);
  assert.equal(html.includes("food-card"), false);
  assert.equal(html.includes("phone"), false);
  assert.equal(SITE_UPDATES.some((update) => update.project === "Plainwork Studio" && /open concepten/i.test(update.text)), true);
  assert.match(html, /Laatste updates/);
  assert.match(html, /Binnenkort/);
});
