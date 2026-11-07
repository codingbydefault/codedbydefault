import assert from "node:assert/strict";
import test from "node:test";
import { buildGuideDownloadUrl, buildDownloadInsert, createDownloadToken, guideFilePath, persistDownload, readDownloadToken } from "../lib/guides/download";
import { GUIDE_FILENAME } from "../lib/guides/constants";
import { buildGuideInsert, parseGuideSubmission } from "../lib/leads/guide";
import { persistGuide, persistQuickscan } from "../lib/leads/persist";
import { buildQuickscanInsert, parseQuickscanSubmission } from "../lib/leads/quickscan";
import fs from "node:fs";

test("een gidsaanvraag bewaart alleen de gevraagde velden", () => {
  assert.deepEqual(parseGuideSubmission({ name: "  Sara  ", email: "Sara@Bedrijf.nl", website: "" }), {
    kind: "ok",
    value: { name: "Sara", email: "sara@bedrijf.nl" },
  });
  assert.equal(parseGuideSubmission({ name: "Sara", email: "sara@bedrijf.nl", website: "http://spam" }).kind, "honeypot");
  assert.equal(parseGuideSubmission({ name: "", email: "sara@bedrijf.nl" }).kind, "invalid");
  assert.equal(parseGuideSubmission({ name: "Sara", email: "geen-adres" }).kind, "invalid");

  const row = buildGuideInsert({
    requestId: "11111111-1111-4111-8111-111111111111",
    name: "Sara",
    email: "sara@bedrijf.nl",
    downloadToken: "a".repeat(64),
  });
  assert.deepEqual(Object.keys(row).sort(), ["download_token", "email", "guide", "name", "request_id", "status"]);
  assert.equal(JSON.stringify(row).includes("ip"), false);
  assert.equal(row.guide, "cbd-ai-automatiseringsgids-2026");
  assert.equal(row.status, "guide_sent");
});

test("een quickscan bewaart alleen de formulierVelden", () => {
  const parsed = parseQuickscanSubmission({
    name: "Bram",
    company: "",
    email: "Bram@Bedrijf.nl",
    url: "https://bedrijf.nl/pad",
    question: "Weinig aanvragen",
    website: "",
    ip: "203.0.113.10",
  });
  assert.equal(parsed.kind, "ok");
  if (parsed.kind !== "ok") return;
  assert.equal(parsed.value.company, null);
  assert.equal(parsed.value.email, "bram@bedrijf.nl");
  const row = buildQuickscanInsert({ requestId: "22222222-2222-4222-8222-222222222222", submission: parsed.value });
  assert.deepEqual(Object.keys(row).sort(), ["company", "email", "name", "question", "request_id", "status", "website"]);
  assert.equal("ip" in row, false);
  assert.equal(row.website, "https://bedrijf.nl/pad");
  assert.equal(parseQuickscanSubmission({ name: "Bram", email: "bram@bedrijf.nl", url: "bedrijf.nl" }).kind, "invalid");
  assert.equal(parseQuickscanSubmission({ name: "Bram", email: "bram@bedrijf.nl", url: "javascript:alert(1)" }).kind, "invalid");
  assert.equal(parseQuickscanSubmission({ name: "Bram", email: "bram@bedrijf.nl", url: "https://bedrijf.nl", website: "vul" }).kind, "honeypot");
});

test("opslaan slaat over zonder database en vangt een fout zodat de mail kan doorgaan", async () => {
  const row = buildGuideInsert({
    requestId: "11111111-1111-4111-8111-111111111111",
    name: "Sara",
    email: "sara@bedrijf.nl",
    downloadToken: "b".repeat(64),
  });
  assert.deepEqual(await persistGuide(null, row), { ok: true, skipped: true });
  const failed = await persistGuide({
    async insertGuide() {
      return { message: "relation does not exist" };
    },
  }, row);
  assert.deepEqual(failed, { ok: false, error: "relation does not exist" });
  const thrown = await persistQuickscan({
    async insertQuickscan() {
      throw new Error("timeout");
    },
  }, buildQuickscanInsert({
    requestId: "33333333-3333-4333-8333-333333333333",
    submission: { name: "Bram", company: null, email: "bram@bedrijf.nl", website: "https://bedrijf.nl/", question: null },
  }));
  assert.deepEqual(thrown, { ok: false, error: "timeout" });
});

test("downloads krijgen een token of vallen terug op de oude link", async () => {
  const token = createDownloadToken();
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(readDownloadToken("kort"), null);
  assert.equal(readDownloadToken(token), token);
  const url = new URL(buildGuideDownloadUrl("https://codedbydefault.vercel.app", token));
  assert.equal(url.pathname, `/downloads/${GUIDE_FILENAME}`);
  assert.equal(url.searchParams.get("t"), token);

  const seen: unknown[] = [];
  const matched = await persistDownload({
    async findRequestIdByToken(value) {
      assert.equal(value, token);
      return 7;
    },
    async insertDownload(row) {
      seen.push(row);
      return null;
    },
  }, token);
  assert.equal(matched.ok, true);
  assert.deepEqual(seen[0], { guide: "cbd-ai-automatiseringsgids-2026", guide_request_id: 7, source: "token" });

  const legacy: unknown[] = [];
  await persistDownload({
    async findRequestIdByToken() {
      throw new Error("mag niet bevraagd worden");
    },
    async insertDownload(row) {
      legacy.push(row);
      return null;
    },
  }, "geen-token");
  assert.deepEqual(legacy[0], { guide: "cbd-ai-automatiseringsgids-2026", guide_request_id: null, source: "legacy" });
  assert.deepEqual(buildDownloadInsert(null).source, "legacy");
  assert.equal(fs.existsSync(guideFilePath()), true);
  assert.equal(fs.existsSync(`public/downloads/${GUIDE_FILENAME}`), false);
});
