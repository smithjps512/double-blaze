/**
 * Making a Vercel preview deployment reviewable.
 *
 * ---------------------------------------------------------------------------
 * The problem this exists for
 * ---------------------------------------------------------------------------
 *
 * `resolveTenant` decides which club a request belongs to from the hostname:
 * first a verified `site_domains` row, then a subdomain of the platform domain.
 * A preview deployment is served from `something.vercel.app`, which is neither,
 * so the tenant resolves to null and every page returns 404.
 *
 * The consequence is that the preview build attached to a pull request cannot
 * be looked at, which means the only way to review a change to the member area
 * is to merge it first. That is the wrong order, and it was noticed the session
 * after a design pass shipped without anybody having seen it running.
 *
 * ---------------------------------------------------------------------------
 * Why this is narrow on purpose
 * ---------------------------------------------------------------------------
 *
 * A tenant identifier that does not come from the hostname is exactly the thing
 * `tenant.ts` warns about, so this one is fenced in three ways:
 *
 *  1. **It only applies when the hostname resolved to nothing.** A real club's
 *     hostname is unaffected, because that path returns before this is
 *     consulted.
 *  2. **It requires an environment variable that production does not set.**
 *     Vercel scopes variables per environment, so `PREVIEW_SITE_SLUG` exists in
 *     Preview and is absent in Production.
 *  3. **It refuses to work in production even if somebody sets it there.**
 *     Belt and braces, because the failure mode of a variable set in the wrong
 *     environment is that any hostname pointed at the deployment starts serving
 *     a real club, and a mistake in Vercel's UI should not be able to cause
 *     that.
 *
 * What it is not is an authentication bypass. A preview deployment still
 * requires a real session, and every query still runs under that member's own
 * row level security. This decides which club's front door you are looking at,
 * and nothing about who may open it.
 *
 * Pure and framework-free, so the rule can be tested without a request.
 */

export interface PreviewEnv {
  /** The club slug a preview deployment should serve. Unset outside Preview. */
  PREVIEW_SITE_SLUG?: string;
  /** Set by Vercel to "production", "preview", or "development". */
  VERCEL_ENV?: string;
  /**
   * Everything else on the environment. Present so `process.env` can be passed
   * straight in: without it TypeScript treats this as a weak type and refuses
   * an object whose other keys it does not recognise.
   */
  [key: string]: string | undefined;
}

/**
 * The same shape `validateSubdomain` enforces on a real subdomain.
 *
 * The value reaches a `.eq("slug", ...)` on a parameterized query, so this is
 * not about injection. It is about a typo or a pasted URL failing loudly here
 * rather than turning into a silent 404 somebody debugs for an hour.
 */
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * The club a preview deployment should fall back to, or nothing.
 *
 * Nothing is the answer in production, in any environment that has not opted
 * in, and for any value that is not a plausible slug.
 */
export function previewSiteSlug(env: PreviewEnv): string | null {
  // Production never falls back, whatever is configured. This is the check that
  // makes a misconfigured variable harmless rather than load bearing.
  if (env.VERCEL_ENV === "production") return null;

  const slug = (env.PREVIEW_SITE_SLUG ?? "").trim().toLowerCase();
  if (!slug || !SLUG.test(slug)) return null;

  return slug;
}
