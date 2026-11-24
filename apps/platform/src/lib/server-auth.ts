import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkEnabled, type Role } from "./auth";
import { isTeacherAccount, parseTeacherEmails } from "./class-teacher";

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

/**
 * Returns true if the current user is staff (project_lead or admin).
 * Returns true when Clerk is not configured so staff routes work in dev.
 */
export async function requireStaff(): Promise<boolean> {
  if (!isClerkEnabled) return true;
  const role = await getCurrentRole();
  return role === "project_lead" || role === "admin";
}

/**
 * Returns true if the signed-in user is the class teacher: a verified email on
 * their Clerk account is in CLASS_TEACHER_EMAILS. Staff role alone is not
 * enough, so business partners never see student work. Unset list = nobody.
 * Returns true when Clerk is not configured, matching requireStaff in dev.
 */
export async function isClassTeacher(): Promise<boolean> {
  if (!isClerkEnabled) return true;
  const allowed = parseTeacherEmails(process.env.CLASS_TEACHER_EMAILS);
  if (allowed.length === 0) return false;
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  if (!user) return false;
  const emails = user.emailAddresses.map((e) => ({
    address: e.emailAddress,
    verified: e.verification?.status === "verified",
  }));
  return isTeacherAccount(emails, allowed);
}
