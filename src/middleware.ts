import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";

/**
 * Auth middleware plus Trailhead subdomain routing.
 *
 * Subdomain routing: no database work in middleware. If the hostname matches
 * *.doubleblaze.solutions (and is not the bare domain or www), rewrite to
 * /trailhead-site/[subdomain]. The page performs the lookup and 404s if
 * unknown, cached with ISR.
 */
const isProtectedRoute = createRouteMatcher([
  "/portal(.*)",
  "/execution(.*)",
]);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

/** The primary domain (without subdomain). */
const PRIMARY_DOMAIN = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? "doubleblaze.solutions";

function extractTrailheadSubdomain(host: string): string | null {
  // Strip port for local dev
  const hostname = host.split(":")[0];

  // Must end with the primary domain
  if (!hostname.endsWith(`.${PRIMARY_DOMAIN}`)) return null;

  // Extract the subdomain part
  const sub = hostname.slice(0, -(PRIMARY_DOMAIN.length + 1));

  // Ignore www, empty, or multi-level subdomains
  if (!sub || sub === "www" || sub.includes(".")) return null;

  return sub;
}

export default function middleware(req: NextRequest, event: never) {
  const host = req.headers.get("host") ?? "";

  // Trailhead subdomain rewrite (no DB, just URL rewrite)
  const subdomain = extractTrailheadSubdomain(host);
  if (subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = `/trailhead-site/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (!isClerkEnabled) {
    return NextResponse.next();
  }
  // Delegate to Clerk when configured.
  return (withClerk as unknown as (r: NextRequest, e: never) => Response)(
    req,
    event,
  );
}

export const config = {
  matcher: [
    // Skip Next internals and static files unless in a search param.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk auto-proxy path (keep after the api/trpc matcher).
    "/__clerk/:path*",
  ],
};
