import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";

/**
 * Auth middleware.
 *
 * Customer subdomain serving used to happen here, rewriting
 * *.doubleblaze.solutions into a route in this app. It now lives in the
 * separate sites deployment, which owns the wildcard, so this app is only ever
 * reached at its own hostnames and has no hostname routing left to do.
 *
 * The reserved subdomain list still matters, but only for intake validation,
 * which is where it started. Which hostnames reach which deployment is now
 * decided by Vercel domain assignment rather than by code.
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

export default function middleware(req: NextRequest, event: never) {
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
