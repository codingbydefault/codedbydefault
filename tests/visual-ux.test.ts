import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { renderProjectSection } from "../lib/site/render-projects";

test("de homepage houdt dezelfde teksten en toont een menu plus kleinere logo's", () => {
  const html = fs.readFileSync("site-template/index.html", "utf8");
  assert.match(html, /class="nav-toggle"/);
  assert.match(html, /id="site-menu"/);
  assert.match(html, />Menu</);
  assert.match(html, /Gratis quickscan ↗/);
  assert.match(html, /Vraag mijn quickscan aan/);
  assert.match(html, /Stuur de gids naar mijn inbox/);
  assert.match(html, /codedbydefault-logo-96\.webp 96w/);
  assert.equal(html.includes("codedbydefault-logo-v02.png"), false);
  assert.match(html, /aria-label="Bekijk webdesign demo"/);
});

test("projectbeelden wijzen naar passend geschaalde webp-bestanden", () => {
  const html = renderProjectSection();
  assert.match(html, /src="\/projects\/fodmap-logo-160\.webp"/);
  assert.match(html, /fodmap-logo-240\.webp 240w/);
  assert.match(html, /src="\/projects\/geregeldwerk-logo-320\.webp"/);
  assert.match(html, /src="\/projects\/plainwork-home-480\.webp"/);
  assert.match(html, /plainwork-home-640\.webp 640w/);
  assert.match(html, /de-bumperbank\.svg/);
  assert.match(html, /alt="Logo van Fodmap Tracker\."/);
  assert.match(html, /alt="Schermafbeelding van de publieke homepage van Plainwork Studio\."/);
  assert.equal(html.includes("/projects/fodmap-logo.png"), false);
  for (const file of [
    "public/projects/fodmap-logo-160.webp",
    "public/projects/fodmap-logo-240.webp",
    "public/projects/geregeldwerk-logo-320.webp",
    "public/projects/geregeldwerk-logo-480.webp",
    "public/projects/plainwork-home-480.webp",
    "public/projects/plainwork-home-640.webp",
    "public/assets/codedbydefault-logo-96.webp",
    "public/assets/codedbydefault-logo-360.webp",
  ]) {
    assert.equal(fs.existsSync(file), true, file);
  }
});

test("foutstatus en 404 gebruiken leesbare stijl zonder de footertekst van de open PR te wijzigen", () => {
  const styles = fs.readFileSync("public/styles.css", "utf8");
  const projects = fs.readFileSync("public/projects.css", "utf8");
  const missing = fs.readFileSync("app/not-found.tsx", "utf8");
  const script = fs.readFileSync("public/site.js", "utf8");
  assert.match(styles, /a:focus-visible/);
  assert.match(styles, /\.miss h1/);
  assert.match(projects, /footer \.legal\{[^}]*color:#666b73/);
  assert.match(projects, /\.project-disclaimer\{[^}]*color:#80848b/);
  assert.match(projects, /\.form-note\.is-error\{[^}]*border-left:2px solid #ff896f/);
  assert.match(projects, /\.quickscan \.kicker\{color:#5e6064\}/);
  assert.match(script, /is-pending/);
  assert.match(script, /aria-busy/);
  assert.match(script, /Sluit/);
  assert.match(missing, /Deze pagina bestaat niet\./);
  assert.match(missing, /Naar de homepage/);
});
