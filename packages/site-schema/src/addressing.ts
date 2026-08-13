/**
 * Site addressing: what a customer site may be called and how a request
 * hostname resolves to one.
 *
 * Shared because both halves of the system need the same answer from opposite
 * directions. The platform validates a name at intake, deciding what may be
 * claimed. The site runtime resolves a hostname per request, deciding what may
 * be served. If those two ever disagree, a name is either claimable but
 * unservable or servable but unclaimable, so they read from one list.
 */

/**
 * Reserved subdomains: system routes, infrastructure names, and anything that
 * would collide with a current or future Double Blaze path.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "api",
  "mail",
  "admin",
  "portal",
  "studio",
  "docs",
  "blog",
  "status",
  // Current and future routes
  "pricing",
  "services",
  "solutions",
  "about",
  "regions",
  "start-a-project",
  "trail-run",
  "trailhead",
  "checkout",
  "execution",
  "sign-in",
  "sign-up",
  "sitemap",
  "robots",
]);

export interface SubdomainValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate a candidate subdomain. Rules:
 * - Lowercase alphanumeric and hyphens only
 * - No leading or trailing hyphen
 * - 3 to 40 characters
 * - Not in the reserved list
 */
export function validateSubdomain(name: string): SubdomainValidation {
  if (!name) {
    return { valid: false, error: "Subdomain is required." };
  }
  if (name !== name.toLowerCase()) {
    return { valid: false, error: "Subdomain must be lowercase." };
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      error: "Only lowercase letters, numbers, and hyphens are allowed.",
    };
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    return {
      valid: false,
      error: "Subdomain cannot start or end with a hyphen.",
    };
  }
  if (name.length < 3) {
    return { valid: false, error: "Subdomain must be at least 3 characters." };
  }
  if (name.length > 40) {
    return { valid: false, error: "Subdomain must be 40 characters or fewer." };
  }
  if (RESERVED_SUBDOMAINS.has(name)) {
    return { valid: false, error: "That name is reserved. Please choose another." };
  }
  return { valid: true };
}

/**
 * Resolve a request hostname to the customer-site subdomain it should serve,
 * or null if the request belongs to the Double Blaze app itself.
 *
 * Lives here rather than in middleware so it stays pure and testable. The
 * reserved list is the same one `validateSubdomain` enforces at intake, which
 * is the point: a name nobody can claim must also never be routed to a
 * customer site. Without that check the wildcard swallows every reserved name,
 * so `app.doubleblaze.solutions` rewrites to a site lookup and 404s instead of
 * reaching the app. Returning null lets the request fall through to normal
 * app routing.
 *
 * Multi-level subdomains are not served: a wildcard certificate covers exactly
 * one label, so `a.b.doubleblaze.solutions` could not present valid TLS anyway.
 */
export function resolveSiteSubdomain(
  host: string,
  primaryDomain: string,
): string | null {
  // Strip the port, which is present in local dev.
  const hostname = host.split(":")[0].toLowerCase();

  if (!hostname.endsWith(`.${primaryDomain}`)) return null;

  const sub = hostname.slice(0, -(primaryDomain.length + 1));

  if (!sub || sub.includes(".")) return null;
  if (RESERVED_SUBDOMAINS.has(sub)) return null;

  return sub;
}
