import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  renderBlock,
  renderSite,
  renderSitePage,
  renderMarkdown,
  safeHref,
  pageHref,
  DEFAULT_THEME,
  type RenderContext,
} from "./blocks.js";
import type { Block, SiteContent } from "@double-blaze/site-schema";

const live: RenderContext = { linkStyle: "live" };
const withAssets: RenderContext = {
  linkStyle: "live",
  assetUrl: (id) => (id === "known" ? "https://cdn.example/known.jpg" : null),
};

function site(pages: SiteContent["pages"]): SiteContent {
  return {
    siteName: "AI Interest for Electric Grid",
    tagline: "Where the grid meets AI",
    pages,
    theme: DEFAULT_THEME,
    footerCredit: false,
  };
}

describe("safeHref", () => {
  it("allows the schemes a site legitimately needs", () => {
    assert.equal(safeHref("https://tva.com"), "https://tva.com");
    assert.equal(safeHref("mailto:a@b.com"), "mailto:a@b.com");
    assert.equal(safeHref("tel:+15551234"), "tel:+15551234");
    assert.equal(safeHref("/about"), "/about");
    assert.equal(safeHref("#section"), "#section");
  });

  it("neutralizes script-bearing schemes", () => {
    assert.equal(safeHref("javascript:alert(1)"), "#");
    assert.equal(safeHref("  JavaScript:alert(1)"), "#");
    assert.equal(safeHref("data:text/html,<script>"), "#");
    assert.equal(safeHref("vbscript:msgbox"), "#");
  });
});

describe("renderMarkdown", () => {
  it("escapes authored markup before doing anything else", () => {
    const out = renderMarkdown("<script>alert(1)</script>");
    assert.ok(!out.includes("<script>"), "raw script tag must not survive");
    assert.ok(out.includes("&lt;script&gt;"));
  });

  it("renders headings starting at h2, since h1 is the page title", () => {
    assert.ok(renderMarkdown("# Top").includes("<h2>Top</h2>"));
    assert.ok(renderMarkdown("## Second").includes("<h3>Second</h3>"));
  });

  it("renders lists, emphasis, and code", () => {
    const list = renderMarkdown("- one\n- two");
    assert.ok(list.includes("<ul>"));
    assert.ok(list.includes("<li>one</li>"));
    assert.ok(renderMarkdown("**bold**").includes("<strong>bold</strong>"));
    assert.ok(renderMarkdown("*it*").includes("<em>it</em>"));
    assert.ok(renderMarkdown("`x`").includes("<code>x</code>"));
  });

  it("renders links and rejects an unsafe one", () => {
    assert.ok(
      renderMarkdown("[TVA](https://tva.com)").includes('<a href="https://tva.com">TVA</a>'),
    );
    const bad = renderMarkdown("[x](javascript:alert(1))");
    assert.ok(!bad.includes("javascript:"), "javascript href must not survive");
  });

  it("separates paragraphs on blank lines", () => {
    const out = renderMarkdown("one\n\ntwo");
    assert.equal((out.match(/<p>/g) ?? []).length, 2);
  });
});

describe("pageHref", () => {
  it("maps home and inner pages per serving context", () => {
    assert.equal(pageHref("home", { linkStyle: "live" }), "/");
    assert.equal(pageHref("about", { linkStyle: "live" }), "/about");
    assert.equal(pageHref("home", { linkStyle: "export" }), "/index.html");
    assert.equal(pageHref("about", { linkStyle: "export" }), "/about.html");
    assert.equal(
      pageHref("about", { linkStyle: "preview", token: "t1" }),
      "/api/sites/preview/t1?page=about",
    );
  });
});

describe("renderBlock", () => {
  it("renders a hero with an escaped heading", () => {
    const out = renderBlock(
      { type: "hero", heading: "Grid & <AI>", sub: "Sub" },
      live,
    );
    assert.ok(out.includes("Grid &amp; &lt;AI&gt;"));
    assert.ok(!out.includes("<AI>"));
  });

  it("rewrites a bare slug CTA to the serving context", () => {
    const out = renderBlock(
      { type: "hero", heading: "H", cta: { label: "Join", href: "join" } },
      live,
    );
    assert.ok(out.includes('href="/join"'));
  });

  it("drops media whose asset cannot be resolved", () => {
    const shown = renderBlock(
      { type: "hero", heading: "H", media: { assetId: "known", alt: "A photo" } },
      withAssets,
    );
    assert.ok(shown.includes("https://cdn.example/known.jpg"));
    assert.ok(shown.includes('alt="A photo"'));

    const missing = renderBlock(
      { type: "hero", heading: "H", media: { assetId: "gone" } },
      withAssets,
    );
    assert.ok(!missing.includes("<img"), "unresolvable asset must not render a broken image");
  });

  it("renders a whole gallery as nothing when no asset resolves", () => {
    const out = renderBlock(
      { type: "gallery", assets: [{ assetId: "gone" }, { assetId: "also-gone" }] },
      withAssets,
    );
    assert.equal(out, "");
  });

  it("emits no member data into a public artifact", () => {
    const roster = renderBlock(
      { type: "roster", source: "members", fields: ["name", "employer"] },
      live,
    );
    assert.ok(roster.includes('data-source="members"'));
    assert.ok(roster.includes("Member directory"));

    const gated = renderBlock(
      {
        type: "members_only",
        blocks: [{ type: "prose", markdown: "secret roster contents" }],
      },
      live,
    );
    assert.ok(
      !gated.includes("secret roster contents"),
      "gated content must never reach a cached public page",
    );
    assert.ok(gated.includes('data-gate="members"'));
  });

  it("passes staff-authored html through verbatim", () => {
    const out = renderBlock({ type: "html", html: "<div id='custom'>x</div>" }, live);
    assert.ok(out.includes("<div id='custom'>x</div>"));
  });

  it("escapes form labels as text and field keys as attributes", () => {
    const out = renderBlock(
      {
        type: "form",
        formKey: "join",
        deliverTo: "a@b.com",
        fields: [
          // A quote in a label is safe as text content, but a quote in a key
          // would break out of the attribute it lands in, so the two are
          // escaped differently on purpose.
          { key: 'na"me', label: "Employer <required>", type: "text", required: true },
        ],
      },
      live,
    );
    assert.ok(out.includes("Employer &lt;required&gt;"), "label escaped as text");
    assert.ok(!out.includes("<required>"));
    assert.ok(out.includes("na&quot;me"), "key escaped for attribute context");
    assert.ok(!/name="na"me"/.test(out), "quote must not break out of the attribute");
    assert.ok(out.includes("required"));
    assert.ok(out.includes('action="/api/sites/forms/join"'));
  });

  it("skips an unknown block type rather than throwing", () => {
    const unknown = { type: "future-block", data: 1 } as unknown as Block;
    assert.equal(renderBlock(unknown, live), "");
  });
});

describe("renderSitePage", () => {
  const content = site([
    { slug: "home", title: "Home", blocks: [{ type: "hero", heading: "Welcome" }] },
    { slug: "about", title: "About", blocks: [{ type: "prose", markdown: "Hello" }] },
    { slug: "secret", title: "Secret", inNav: false, blocks: [] },
  ]);

  it("produces a complete standalone document", () => {
    const page = renderSitePage(content, 0, live);
    assert.ok(page);
    assert.ok(page.html.startsWith("<!DOCTYPE html>"));
    assert.ok(page.html.includes("</html>"));
    assert.ok(page.html.includes("<style>"), "CSS must be inlined for a self-contained page");
    assert.ok(!page.html.includes("<script"), "no JavaScript in a rendered page");
  });

  it("names the home page index.html and others by slug", () => {
    assert.equal(renderSitePage(content, 0, live)?.filename, "index.html");
    assert.equal(renderSitePage(content, 1, live)?.filename, "about.html");
  });

  it("omits inNav:false pages from navigation but still renders them", () => {
    const home = renderSitePage(content, 0, live);
    assert.ok(!home!.html.includes(">Secret<"), "hidden page must not appear in nav");
    assert.ok(renderSitePage(content, 2, live), "hidden page still renders");
  });

  it("marks the current page active in navigation", () => {
    const about = renderSitePage(content, 1, live);
    assert.ok(about!.html.includes('class="active">About<'));
  });

  it("includes the tagline as a meta description", () => {
    assert.ok(renderSitePage(content, 0, live)!.html.includes('name="description"'));
  });

  it("omits the credit when footerCredit is false and includes it when true", () => {
    assert.ok(!renderSitePage(content, 0, live)!.html.includes("Built by Double Blaze"));
    const credited = renderSitePage({ ...content, footerCredit: true }, 0, live);
    assert.ok(credited!.html.includes("Built by Double Blaze"));
  });

  it("returns null past the end rather than an empty document", () => {
    assert.equal(renderSitePage(content, 99, live), null);
  });

  it("escapes the site name in the title", () => {
    const evil = renderSitePage({ ...content, siteName: "<script>" }, 0, live);
    assert.ok(!evil!.html.includes("<title><script>"));
    assert.ok(evil!.html.includes("&lt;script&gt;"));
  });
});

describe("renderSite", () => {
  it("renders every page, including ones hidden from navigation", () => {
    const pages = renderSite(
      site([
        { slug: "home", title: "Home", blocks: [] },
        { slug: "about", title: "About", blocks: [] },
        { slug: "hidden", title: "Hidden", inNav: false, blocks: [] },
      ]),
      { linkStyle: "export" },
    );
    assert.equal(pages.length, 3);
    assert.deepStrictEqual(
      pages.map((p) => p.filename),
      ["index.html", "about.html", "hidden.html"],
    );
  });

  it("produces an empty list for a site with no pages", () => {
    assert.deepStrictEqual(renderSite(site([]), { linkStyle: "export" }), []);
  });
});
