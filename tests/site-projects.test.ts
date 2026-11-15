import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { CATALOG_PROJECTS, HOME_CARDS } from "../content/projects";
import { STARTER_PROJECTS } from "../lib/admin/projects";
import { renderFeaturedProject, renderProjectSection } from "../lib/site/render-projects";

const syncMigration = fs.readFileSync("supabase/migrations/20261115080000_sync_public_projects.sql", "utf8");

test("homepage en beheer delen dezelfde projectlijst", () => {
  assert.equal(STARTER_PROJECTS.length, CATALOG_PROJECTS.length);
  assert.deepEqual(
    STARTER_PROJECTS.map((project) => project.slug),
    CATALOG_PROJECTS.map((project) => project.slug),
  );
  assert.equal(STARTER_PROJECTS[0]?.name, "DefaultStackr");
  assert.equal(STARTER_PROJECTS[0]?.featured, true);
  assert.equal(HOME_CARDS.some((project) => project.slug === "defaultstackr"), false);
  for (const project of CATALOG_PROJECTS) {
    assert.ok(project.summary.length <= 400, project.slug);
    assert.equal(project.progress, 0);
  }
});

test("de kaarten blijven eerlijk over status en links", () => {
  const bumpr = HOME_CARDS.find((project) => project.slug === "bumpr");
  const bumper = HOME_CARDS.find((project) => project.slug === "de-bumperbank");
  const plainwork = HOME_CARDS.find((project) => project.slug === "plainwork-studio");
  assert.equal(bumpr?.url, null);
  assert.equal(bumpr?.hrefLabel, "Bekijk in de webshop");
  assert.equal(bumpr?.publicLabel, "Binnenkort");
  assert.match(bumpr?.summary ?? "", /Binnenkort verkrijgbaar via de webshop/);
  assert.match(bumper?.summary ?? "", /nog niet mogelijk/);
  assert.equal(plainwork?.url, "https://plainwork-studio.vercel.app/");
  const html = `${renderFeaturedProject()}\n${renderProjectSection()}`;
  assert.match(html, /Build\. Deploy\./);
  assert.match(html, /Default<span>Stackr<\/span>/);
  assert.match(html, /Nu in ontwikkeling/);
  assert.match(html, /href="https:\/\/www\.defaultstackr\.cloud\/"/);
  assert.match(html, /Nog geen live dienst/);
  assert.match(html, /de-bumperbank\.svg/);
  assert.match(html, /PREMIUM CAR CARE/);
  assert.equal(html.includes('href=""'), false);
  const bumprHtml = html.split('class="project project-bumpr')[1]?.split("</article>")[0] ?? "";
  assert.equal(bumprHtml.includes("href="), false);
  assert.match(bumprHtml, /Binnenkort verkrijgbaar via de webshop/);
});

test("de migratie voegt featured toe en overschrijft geen voortgang", () => {
  assert.match(syncMigration, /add column if not exists featured boolean not null default false/);
  assert.equal(/progress\s*=\s*excluded\.progress/i.test(syncMigration), false);
  for (const slug of ["defaultstackr", "de-bumperbank", "bumpr", "fodmap-tracker", "geregeldwerk", "plainwork-studio"]) {
    assert.match(syncMigration, new RegExp(`'${slug}'`));
  }
  assert.match(syncMigration, /'defaultstackr'[\s\S]*true/);
});
