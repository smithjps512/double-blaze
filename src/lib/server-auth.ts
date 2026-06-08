import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkEnabled, type Role } from "./auth";

/**
 * Reads the current user's role from Clerk publicMetadata. Returns null when
 * Clerk is not configured or no user is signed in. The role is set on the
 * Clerk user as publicMetadata.role and mirrored into the `users` table.
 */
export async function getCurrentRole(): Promise<Role | null> {
  if (!isClerkEnabled) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  if (role === "client" || role === "project_lead" || role === "admin") {
    return role;
  }
  // Default any authenticated user without an explicit role to client.
  return "client";
}
