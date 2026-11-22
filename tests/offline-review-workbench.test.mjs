import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(
  fileURLToPath(new URL("../tools/equipment-review-workbench.html", import.meta.url)),
  "utf8",
);

test("offline review workbench contains only inline local code and no remote assets", () => {
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /script-src 'unsafe-inline'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
  assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage)\s*\(/);
});

test("workbench inline JavaScript is syntactically valid and uses explicit human approvals", () => {
  const code = html.match(/<script>\s*([\s\S]*?)<\/script>/i);
  assert.ok(code);
  assert.doesNotThrow(() => new vm.Script(code[1]));
  assert.match(code[1], /reviewNote\.trim\(\)\.length < 20/);
  assert.match(code[1], /candidateSourceRows/);
  assert.match(code[1], /new Blob/);
  assert.match(code[1], /schemaVersion:"20\.5-approvals"/);
  assert.match(code[1], /no-source-records/);
  assert.match(code[1], /base-item-field-conflict/);
  assert.match(code[1], /20\.11-private/);
  assert.match(code[1], /id-collision-different-names/);
  assert.match(html, /id="group-file"/);
});
