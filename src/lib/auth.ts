/**
 * Auth roles (spec section 2). Clerk is the source of identity; the role is
 * stored on the Clerk user's publicMetadata as `{ role: Role }` and mirrored
 * into the `users` table (spec section 4).
 *
 * The storefront builds and runs without Clerk configured. `isClerkEnabled`
 * gates all auth wiring so the public marketing site has no hard dependency on
 * Clerk keys being present.
 */
export type Role = "client" | "project_lead" | "admin";

export const ROLES: Role[] = ["client", "project_lead", "admin"];

/** Staff roles operate the execution portal; clients use the client portal. */
export const STAFF_ROLES: Role[] = ["project_lead", "admin"];

export const isClerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

export function isStaffRole(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
