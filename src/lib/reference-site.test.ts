import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractProfileFromHtml,
  formatReferenceProfile,
  isSafeReferenceUrl,
} from "./reference-site";

test("extracts title, description, and theme color regardless of attribute order", () => {
  const html = `
    <html><head>
      <title>  Ridgeline   Coffee </title>
      <meta content="Small batch roaster" name="description">
      <meta name="theme-color" content="#0b3d2e">
    </head><body></body></html>`;
  const p = extractProfileFromHtml(html, { url: "https://example.com" });
  assert.equal(p.title, "Ridgeline Coffee");
  assert.equal(p.description, "Small batch roaster");
  assert.equal(p.themeColor, "#0b3d2e");
});

test("ranks colors by frequency and normalizes shorthand and alpha hex", () => {
  const css = `
    a { color: #FFF; }
    b { color: #ffffff; }
    c { color: #ffffff; }
    d { background: #0b3d2e; }
    e { border-color: #0b3d2eff; }
    f { color: rgb(11,  61, 46); }
    g { color: rgb(11, 61, 46); }`;
  const p = extractProfileFromHtml("", { url: "https://x.com", css });
  // #ffffff appears 3x (incl. shorthand), #0b3d2e 2x (alpha collapsed), rgb 2x.
  assert.equal(p.colors[0], "#ffffff");
  assert.ok(p.colors.includes("#0b3d2e"));
  assert.ok(p.colors.includes("rgb(11,61,46)"));
});

test("collects named fonts from Google Fonts links and declarations, dropping generics", () => {
  const html = `
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400&family=Open+Sans" rel="stylesheet">`;
  const css = `body { font-family: "Fraunces", Georgia, serif; } h1 { font-family: system-ui, sans-serif; }`;
  const p = extractProfileFromHtml(html, { url: "https://x.com", css });
  assert.deepEqual(p.fonts.slice(0, 2), ["Fraunces", "Open Sans"]);
  assert.ok(!p.fonts.includes("serif"));
  assert.ok(!p.fonts.includes("system-ui"));
});

test("formatReferenceProfile renders a compact block and skips empty profiles", () => {
  const block = formatReferenceProfile({
    url: "https://example.com",
    title: "Ridgeline",
    colors: ["#0b3d2e"],
    fonts: ["Fraunces"],
  });
  assert.ok(block?.includes("https://example.com"));
  assert.ok(block?.includes("#0b3d2e"));
  assert.ok(block?.includes("Fraunces"));

  const empty = formatReferenceProfile({ url: "https://example.com", colors: [], fonts: [] });
  assert.equal(empty, null);
  assert.equal(formatReferenceProfile(null), null);
});

test("isSafeReferenceUrl blocks non-http, loopback, and private ranges", () => {
  assert.equal(isSafeReferenceUrl("https://example.com"), true);
  assert.equal(isSafeReferenceUrl("http://example.com/path"), true);
  assert.equal(isSafeReferenceUrl("ftp://example.com"), false);
  assert.equal(isSafeReferenceUrl("file:///etc/passwd"), false);
  assert.equal(isSafeReferenceUrl("http://localhost:3000"), false);
  assert.equal(isSafeReferenceUrl("http://127.0.0.1"), false);
  assert.equal(isSafeReferenceUrl("http://10.0.0.5"), false);
  assert.equal(isSafeReferenceUrl("http://192.168.1.1"), false);
  assert.equal(isSafeReferenceUrl("http://172.16.0.9"), false);
  assert.equal(isSafeReferenceUrl("http://169.254.169.254"), false);
  assert.equal(isSafeReferenceUrl("http://[::1]"), false);
  assert.equal(isSafeReferenceUrl("not a url"), false);
});
