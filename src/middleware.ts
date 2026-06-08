import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isClerkEnabled } from "@/lib/auth";

/**
 * Auth middleware. The marketing storefront is fully public. Only the portals
 * (client + execution) are protected, and only when Clerk is configured. With
 * no Clerk keys present we pass every request through untouched so the public
 * site runs standalone.
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
  ],
};
