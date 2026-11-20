import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

test("robots laat de homepage toe en houdt beheer en api buiten de index", () => {
  const result = robots();
  assert.equal(result.sitemap, "https://www.codedbydefault.com/sitemap.xml");
  const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  assert.equal(rule?.userAgent, "*");
  assert.deepEqual(rule?.allow, "/");
  assert.deepEqual(rule?.disallow, ["/admin", "/api/"]);
});

test("de sitemap noemt alleen de publieke homepage", () => {
  const urls = sitemap().map((entry) => entry.url);
  assert.deepEqual(urls, ["https://www.codedbydefault.com/"]);
});

test("publieke markup houdt zichtbare namen en het footerlogo bereikbaar", () => {
  const html = fs.readFileSync("site-template/index.html", "utf8");
  assert.equal(html.includes('aria-label="Interactieve visuele demonstratie"'), false);
  for (const label of [
    "Explore, bekijk webdesign demo",
    "Explore, bekijk software demo",
    "Explore, bekijk AI demo",
    "Explore, bekijk IT demo",
  ]) {
    assert.equal(html.includes(`aria-label="${label}"`), true, label);
  }
  assert.match(html, /<footer>[\s\S]*aria-label="CodedByDefault, naar boven"/);
  const css = fs.readFileSync("public/projects.css", "utf8");
  assert.match(css, /footer \.legal\{[^}]*color:#80848b/);
  assert.equal(css.includes("footer .legal{position:absolute;left:var(--pad);bottom:20px;color:#666b73}"), false);
  const script = fs.readFileSync("public/site.js", "utf8");
  assert.match(script, /prefers-reduced-motion: reduce/);
});
