import assert from "node:assert/strict";
import test from "node:test";
import { securityHeaders } from "../next.config";

test("beveiligingsheaders blijven laag-risico en dekken de ontbrekende live headers", () => {
  const headers = Object.fromEntries(securityHeaders.map((header) => [header.key, header.value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["X-Frame-Options"], "SAMEORIGIN");
  assert.equal(headers["Strict-Transport-Security"], "max-age=63072000");
  assert.equal(headers["Strict-Transport-Security"].includes("includeSubDomains"), false);
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  assert.match(headers["Permissions-Policy"], /microphone=\(\)/);
  assert.match(headers["Permissions-Policy"], /geolocation=\(\)/);
  const csp = headers["Content-Security-Policy"];
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /script-src 'self' 'unsafe-inline' https:\/\/va\.vercel-scripts\.com/);
  assert.match(csp, /https:\/\/fonts\.googleapis\.com/);
  assert.match(csp, /https:\/\/fonts\.gstatic\.com/);
  assert.match(csp, /https:\/\/\*\.supabase\.co/);
});
