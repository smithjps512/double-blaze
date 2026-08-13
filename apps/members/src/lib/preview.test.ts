import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { previewSiteSlug } from "./preview.js";

describe("previewSiteSlug", () => {
  it("serves the named club on a preview deployment", () => {
    assert.equal(
      previewSiteSlug({ PREVIEW_SITE_SLUG: "electricgrid", VERCEL_ENV: "preview" }),
      "electricgrid",
    );
  });

  it("does nothing when nobody has opted in", () => {
    // Which is the state of every environment until somebody sets the variable,
    // including local development.
    assert.equal(previewSiteSlug({}), null);
    assert.equal(previewSiteSlug({ VERCEL_ENV: "preview" }), null);
    assert.equal(previewSiteSlug({ PREVIEW_SITE_SLUG: "", VERCEL_ENV: "preview" }), null);
    assert.equal(previewSiteSlug({ PREVIEW_SITE_SLUG: "   ", VERCEL_ENV: "preview" }), null);
  });

  it("refuses to work in production even when it is configured there", () => {
    // The check that makes a variable set in the wrong Vercel environment
    // harmless. Without it, any hostname pointed at the deployment would start
    // serving a real club.
    assert.equal(
      previewSiteSlug({ PREVIEW_SITE_SLUG: "electricgrid", VERCEL_ENV: "production" }),
      null,
    );
  });

  it("works in local development, where VERCEL_ENV is absent", () => {
    assert.equal(previewSiteSlug({ PREVIEW_SITE_SLUG: "electricgrid" }), "electricgrid");
  });

  it("refuses anything that is not a plausible slug", () => {
    for (const value of [
      "Electric Grid",
      "electricgrid.doubleblaze.solutions",
      "-electricgrid",
      "electricgrid-",
      "electric_grid",
      "https://electricgrid",
      "*",
      "a".repeat(64),
    ]) {
      assert.equal(
        previewSiteSlug({ PREVIEW_SITE_SLUG: value, VERCEL_ENV: "preview" }),
        null,
        `accepted ${value}`,
      );
    }
  });

  it("normalizes case, since an environment variable is typed by a person", () => {
    assert.equal(
      previewSiteSlug({ PREVIEW_SITE_SLUG: "  ElectricGrid  ", VERCEL_ENV: "preview" }),
      "electricgrid",
    );
  });
});
