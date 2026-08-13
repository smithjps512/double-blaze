import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateSubdomain,
  resolveSiteSubdomain,
  RESERVED_SUBDOMAINS,
} from "./addressing.js";

describe("validateSubdomain", () => {
  it("accepts valid subdomains", () => {
    assert.deepStrictEqual(validateSubdomain("my-club"), { valid: true });
    assert.deepStrictEqual(validateSubdomain("abc"), { valid: true });
    assert.deepStrictEqual(validateSubdomain("cool-site-123"), { valid: true });
    assert.deepStrictEqual(validateSubdomain("a1b"), { valid: true });
  });

  it("rejects empty input", () => {
    const r = validateSubdomain("");
    assert.equal(r.valid, false);
  });

  it("rejects uppercase", () => {
    const r = validateSubdomain("MyClub");
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("lowercase"));
  });

  it("rejects special characters", () => {
    assert.equal(validateSubdomain("my_club").valid, false);
    assert.equal(validateSubdomain("my.club").valid, false);
    assert.equal(validateSubdomain("my club").valid, false);
    assert.equal(validateSubdomain("my@club").valid, false);
  });

  it("rejects leading hyphen", () => {
    const r = validateSubdomain("-my-club");
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("hyphen"));
  });

  it("rejects trailing hyphen", () => {
    const r = validateSubdomain("my-club-");
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("hyphen"));
  });

  it("rejects too short (< 3)", () => {
    assert.equal(validateSubdomain("ab").valid, false);
    assert.equal(validateSubdomain("a").valid, false);
  });

  it("rejects too long (> 40)", () => {
    const r = validateSubdomain("a".repeat(41));
    assert.equal(r.valid, false);
    assert.ok(r.error?.includes("40"));
  });

  it("accepts exactly 3 and 40 characters", () => {
    assert.equal(validateSubdomain("abc").valid, true);
    assert.equal(validateSubdomain("a".repeat(40)).valid, true);
  });

  it("rejects all reserved subdomains", () => {
    for (const name of RESERVED_SUBDOMAINS) {
      const r = validateSubdomain(name);
      assert.equal(r.valid, false, `Expected "${name}" to be rejected`);
      assert.ok(r.error?.includes("reserved"));
    }
  });
});

describe("resolveSiteSubdomain", () => {
  const DOMAIN = "doubleblaze.solutions";

  it("resolves a customer site subdomain", () => {
    assert.equal(resolveSiteSubdomain(`my-club.${DOMAIN}`, DOMAIN), "my-club");
  });

  it("strips the port used in local dev", () => {
    assert.equal(resolveSiteSubdomain(`my-club.${DOMAIN}:3000`, DOMAIN), "my-club");
  });

  it("is case insensitive, since Host headers are not normalized", () => {
    assert.equal(resolveSiteSubdomain(`My-Club.${DOMAIN}`, DOMAIN), "my-club");
  });

  it("does not resolve the bare domain", () => {
    assert.equal(resolveSiteSubdomain(DOMAIN, DOMAIN), null);
  });

  it("does not resolve a domain that merely ends in the primary domain", () => {
    assert.equal(resolveSiteSubdomain(`notdoubleblaze.solutions`, DOMAIN), null);
  });

  it("does not resolve an unrelated host", () => {
    assert.equal(resolveSiteSubdomain("double-blaze.vercel.app", DOMAIN), null);
    assert.equal(resolveSiteSubdomain("localhost:3000", DOMAIN), null);
  });

  it("does not resolve multi-level subdomains", () => {
    // A wildcard certificate covers exactly one label, so these could never
    // present valid TLS.
    assert.equal(resolveSiteSubdomain(`a.b.${DOMAIN}`, DOMAIN), null);
  });

  it("leaves every reserved subdomain to the app", () => {
    // This is the whole point: a name nobody can claim at intake must not be
    // routed to a customer site lookup either.
    for (const name of RESERVED_SUBDOMAINS) {
      assert.equal(
        resolveSiteSubdomain(`${name}.${DOMAIN}`, DOMAIN),
        null,
        `Expected reserved "${name}" to fall through to app routing`,
      );
    }
  });

  it("leaves www to the app", () => {
    assert.equal(resolveSiteSubdomain(`www.${DOMAIN}`, DOMAIN), null);
  });

  it("honors a non-default primary domain", () => {
    assert.equal(resolveSiteSubdomain("my-club.example.test", "example.test"), "my-club");
    assert.equal(resolveSiteSubdomain(`my-club.${DOMAIN}`, "example.test"), null);
  });
});
