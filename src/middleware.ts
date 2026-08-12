import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";
import { resolveSiteSubdomain } from "@/lib/trailhead";

/**
 * Auth middleware plus Trailhead subdomain routing.
 *
 * Subdomain routing: no database work in middleware. If the hostname matches
 * *.doubleblaze.solutions and the label is not reserved, rewrite to
 * /trailhead-site/[subdomain]. The page performs the lookup and 404s if
 * unknown, cached with ISR. Reserved labels fall through to normal app
 * routing, which is what keeps names like app. and status. available to us.
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

export default function middleware(req: NextRequest, event: never) {
  const host = req.headers.get("host") ?? "";

  // Trailhead subdomain rewrite (no DB, just URL rewrite)
  const subdomain = resolveSiteSubdomain(host, PRIMARY_DOMAIN);
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
