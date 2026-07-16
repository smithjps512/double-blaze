import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTrailheadBuild } from "./trailhead-boundary.js";

describe("validateTrailheadBuild", () => {
  it("passes a valid build", () => {
    const violations = validateTrailheadBuild({
      pages: [
        { slug: "home", html: "<h1>Welcome</h1><p>We sell great things in our shop downtown.</p>" },
        { slug: "about", html: "<h1>About Us</h1><p>Buy into our vision.</p>" },
        { slug: "contact", html: '<form action="/contact"><input name="email" /></form>' },
      ],
      config: { footerCredit: true },
    });
    assert.equal(violations.length, 0);
  });

  it("allows prose mentioning buying, shopping, schedule", () => {
    const violations = validateTrailheadBuild({
      pages: [
        {
          slug: "home",
          html: "<p>Come buy from our shop. Check our schedule. Purchase a membership at our front desk.</p>",
        },
        {
          slug: "events",
          html: "<h1>Events or Schedule</h1><p>Book your spot by calling us.</p>",
        },
      ],
      config: { footerCredit: true },
    });
    assert.equal(violations.length, 0);
  });

  it("rejects more than 5 pages", () => {
    const pages = Array.from({ length: 6 }, (_, i) => ({
      slug: `page-${i}`,
      html: "<p>Content</p>",
    }));
    const violations = validateTrailheadBuild({ pages, config: { footerCredit: true } });
    assert.equal(violations.length, 1);
    assert.equal(violations[0].type, "page_count");
  });

  it("rejects missing footer credit", () => {
    const violations = validateTrailheadBuild({
      pages: [{ slug: "home", html: "<p>Hi</p>" }],
      config: { footerCredit: false },
    });
    assert.ok(violations.some((v) => v.type === "footer_credit"));
  });

  it("rejects custom domain config", () => {
    const violations = validateTrailheadBuild({
      pages: [{ slug: "home", html: "<p>Hi</p>" }],
      config: { footerCredit: true, customDomain: "example.com" },
    });
    assert.ok(violations.some((v) => v.type === "custom_domain"));
  });

  it("rejects Stripe script tag", () => {
    const violations = validateTrailheadBuild({
      pages: [
        {
          slug: "home",
          html: '<script src="https://js.stripe.com/v3/"></script><p>Pay here</p>',
        },
      ],
      config: { footerCredit: true },
    });
    assert.ok(violations.some((v) => v.type === "payment_script"));
  });

  it("rejects PayPal SDK script", () => {
    const violations = validateTrailheadBuild({
      pages: [
        {
          slug: "home",
          html: '<script src="https://www.paypal.com/sdk/js?client-id=abc"></script>',
        },
      ],
      config: { footerCredit: true },
    });
    assert.ok(violations.some((v) => v.type === "payment_script"));
  });

  it("rejects stripe-buy-button element", () => {
    const violations = validateTrailheadBuild({
      pages: [
        { slug: "home", html: '<stripe-buy-button buy-button-id="123"></stripe-buy-button>' },
      ],
      config: { footerCredit: true },
    });
    assert.ok(violations.some((v) => v.type === "cart_component"));
  });

  it("rejects payment form inputs", () => {
    const violations = validateTrailheadBuild({
      pages: [
        {
          slug: "home",
          html: '<form><input name="card-number" autocomplete="cc-number" /></form>',
        },
      ],
      config: { footerCredit: true },
    });
    assert.ok(violations.some((v) => v.type === "payment_form"));
  });

  it("rejects snipcart data attributes", () => {
    const violations = validateTrailheadBuild({
      pages: [
        {
          slug: "home",
          html: '<button data-cart-item-id="prod-1" data-cart-item-price="20">Add</button>',
        },
      ],
      config: { footerCredit: true },
    });
    assert.ok(violations.some((v) => v.type === "cart_component"));
  });
});
