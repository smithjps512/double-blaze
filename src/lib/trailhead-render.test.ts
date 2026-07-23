import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderPage, renderAllPages } from "./trailhead-render.js";
import type { BuiltSite } from "./spark-trailhead.js";

function fixture(footerCredit = true): BuiltSite {
  return {
    pages: [
      { slug: "home", title: "Home", html: "<h1>Welcome</h1>", css: ".h{color:red}" },
      { slug: "about", title: "About", html: "<p>About us</p>", css: "" },
    ],
    global_css: "body{background:#fff}",
    config: {
      footerCredit,
      siteName: "Trail Club",
      navigation: [
        { label: "Home", slug: "home" },
        { label: "About", slug: "about" },
      ],
    },
  };
}

describe("renderPage", () => {
  it("produces a single self-contained standalone HTML document", () => {
    const r = renderPage(fixture(), 0, "trailclub");
    assert.ok(r);
    // Exactly one document, not nested.
    assert.equal(r!.html.match(/<!DOCTYPE html>/gi)?.length, 1);
    assert.equal(r!.html.match(/<html/gi)?.length, 1);
    // Content and inlined styles are present.
    assert.ok(r!.html.includes("<h1>Welcome</h1>"));
    assert.ok(r!.html.includes("body{background:#fff}"));
    assert.ok(r!.html.includes(".h{color:red}"));
    assert.ok(r!.html.includes("Trail Club"));
    // No external asset dependencies (self-contained).
    assert.ok(!/<script/i.test(r!.html));
    assert.ok(!/<link[^>]+stylesheet/i.test(r!.html));
  });

  it("includes the Built by Double Blaze footer credit by default", () => {
    const r = renderPage(fixture(true), 0, "trailclub");
    assert.ok(r!.html.includes("Built by Double Blaze"));
    assert.ok(r!.html.includes("https://doubleblaze.solutions"));
  });

  it("omits the footer credit only when explicitly disabled", () => {
    const r = renderPage(fixture(false), 0, "trailclub");
    assert.ok(!r!.html.includes("Built by Double Blaze"));
  });

  it("writes export-style links (static .html files) by default", () => {
    const r = renderPage(fixture(), 1, "trailclub", "export");
    assert.ok(r!.html.includes('href="/index.html"'));
    assert.ok(r!.html.includes('href="/about.html"'));
  });

  it("writes live-style links (extension-less app paths)", () => {
    const r = renderPage(fixture(), 1, "trailclub", "live");
    assert.ok(r!.html.includes('href="/"'));
    assert.ok(r!.html.includes('href="/about"'));
  });

  it("writes token-scoped preview links", () => {
    const token = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    const r = renderPage(fixture(), 1, "trailclub", "preview", token);
    assert.ok(r!.html.includes(`href="/api/trailhead/preview/${token}"`));
    assert.ok(r!.html.includes(`href="/api/trailhead/preview/${token}?page=about"`));
  });

  it("names the home file index.html and others by slug", () => {
    assert.equal(renderPage(fixture(), 0, "trailclub")!.filename, "index.html");
    assert.equal(renderPage(fixture(), 1, "trailclub")!.filename, "about.html");
  });

  it("returns null for an out-of-range page index", () => {
    assert.equal(renderPage(fixture(), 9, "trailclub"), null);
  });
});

describe("renderAllPages", () => {
  it("renders every page for the export bundle", () => {
    const pages = renderAllPages(fixture(), "trailclub");
    assert.equal(pages.length, 2);
    assert.deepEqual(
      pages.map((p) => p.filename),
      ["index.html", "about.html"],
    );
    // Export links so the bundle works as static files without the app.
    assert.ok(pages[0].html.includes('href="/about.html"'));
  });
});
