import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_THEME, pageTitle, resolveTheme, themeCss } from "./theme.js";

const ELECTRIC_GRID = {
  colors: {
    background: "#ffffff",
    text: "#132330",
    primary: "#0d2b45",
    accent: "#2f9e6f",
    muted: "#5b6f7d",
  },
  fonts: {
    body: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    heading: '"Source Serif 4", Georgia, "Times New Roman", serif',
  },
};

describe("resolveTheme", () => {
  it("takes a club's own tokens", () => {
    const theme = resolveTheme(ELECTRIC_GRID);
    assert.equal(theme.colors.primary, "#0d2b45");
    assert.equal(theme.fonts.heading, ELECTRIC_GRID.fonts.heading);
  });

  it("gives a club with no theme the platform default, not the last club's", () => {
    // The whole reason the tokens moved into the database. A second club
    // inheriting Electric Grid's navy would be worse than looking unfinished.
    assert.deepEqual(resolveTheme(null), DEFAULT_THEME);
    assert.deepEqual(resolveTheme({}), DEFAULT_THEME);
    assert.notEqual(DEFAULT_THEME.colors.primary, ELECTRIC_GRID.colors.primary);
  });

  it("falls back per token rather than wholesale", () => {
    // Three good tokens and two bad ones should give three good tokens, not an
    // unstyled page.
    const theme = resolveTheme({
      colors: { primary: "#0d2b45", accent: "not a colour", muted: "#5b6f7d" },
    });
    assert.equal(theme.colors.primary, "#0d2b45");
    assert.equal(theme.colors.muted, "#5b6f7d");
    assert.equal(theme.colors.accent, DEFAULT_THEME.colors.accent);
  });

  it("accepts both hex forms and normalizes case", () => {
    assert.equal(resolveTheme({ colors: { primary: "#ABC" } }).colors.primary, "#abc");
    assert.equal(resolveTheme({ colors: { primary: "  #0D2B45 " } }).colors.primary, "#0d2b45");
  });

  it("refuses anything that could escape the style tag", () => {
    // These all end up inside a <style> element. A value that closes a rule or
    // the element itself is the whole reason this module validates rather than
    // interpolating.
    const attacks = [
      "red;}body{display:none}",
      "#fff;}</style><script>alert(1)</script>",
      "url(https://evil.test/x)",
      "expression(alert(1))",
      "var(--x)",
      "#0d2b45/*",
    ];
    for (const value of attacks) {
      assert.equal(
        resolveTheme({ colors: { primary: value } }).colors.primary,
        DEFAULT_THEME.colors.primary,
        `accepted ${value}`,
      );
      assert.equal(
        resolveTheme({ fonts: { body: value } }).fonts.body,
        DEFAULT_THEME.fonts.body,
        `accepted font ${value}`,
      );
    }
  });

  it("refuses a named colour, because the safe set is smaller than the valid set", () => {
    assert.equal(resolveTheme({ colors: { text: "rebeccapurple" } }).colors.text, DEFAULT_THEME.colors.text);
  });

  it("caps how long a font stack may be", () => {
    assert.equal(
      resolveTheme({ fonts: { body: "Arial, ".repeat(60) } }).fonts.body,
      DEFAULT_THEME.fonts.body,
    );
  });

  it("survives a malformed column", () => {
    for (const raw of [undefined, "theme", 7, [], { colors: "navy", fonts: 3 }]) {
      assert.deepEqual(resolveTheme(raw), DEFAULT_THEME);
    }
  });
});

describe("themeCss", () => {
  it("emits the variables globals.css consumes", () => {
    const css = themeCss(resolveTheme(ELECTRIC_GRID));
    assert.match(css, /^:root\{/);
    assert.match(css, /\}$/);
    for (const name of ["--bg", "--ink", "--navy", "--green", "--muted", "--line", "--wash", "--sans", "--serif"]) {
      assert.ok(css.includes(`${name}:`), `missing ${name}`);
    }
  });

  it("derives the line and wash from the club's own primary", () => {
    // A grey picked independently of the brand always sits slightly wrong
    // against it, so both are a tint of the club's own colour.
    const css = themeCss(resolveTheme(ELECTRIC_GRID));
    assert.ok(css.includes("--line:color-mix(in srgb, #0d2b45 16%"));
    assert.ok(css.includes("--wash:color-mix(in srgb, #0d2b45 4%"));
  });

  it("puts the loaded faces ahead of the stack from the database", () => {
    // next/font generates a family name for the self-hosted face. The stack on
    // the row becomes the fallback rather than the only instruction.
    const css = themeCss(resolveTheme(ELECTRIC_GRID), {
      body: "__Inter_abc123",
      heading: "__Source_Serif_4_def456",
    });
    assert.ok(css.includes("--sans:__Inter_abc123, \"Inter\""));
    assert.ok(css.includes("--serif:__Source_Serif_4_def456, \"Source Serif 4\""));
  });

  it("never contains a brace or a tag from its input", () => {
    const css = themeCss(resolveTheme({ colors: { primary: "#fff;}</style><b>" } }));
    assert.ok(!css.includes("</style>"));
    assert.ok(!css.includes("<"));
    // Exactly one rule, opened and closed by this module rather than by data.
    // color-mix uses parentheses, so it adds no braces of its own.
    assert.equal((css.match(/\{/g) ?? []).length, 1);
    assert.equal((css.match(/\}/g) ?? []).length, 1);
  });
});

describe("pageTitle", () => {
  it("puts the page first, because a tab strip truncates from the right", () => {
    assert.equal(pageTitle("The library", "AI Interest for Electric Grid"), "The library: AI Interest for Electric Grid");
  });

  it("falls back to the club alone", () => {
    assert.equal(pageTitle(null, "AI Interest for Electric Grid"), "AI Interest for Electric Grid");
    assert.equal(pageTitle("", "AI Interest for Electric Grid"), "AI Interest for Electric Grid");
  });

  it("never renders an empty tab", () => {
    assert.equal(pageTitle(null, ""), "Members");
  });
});
