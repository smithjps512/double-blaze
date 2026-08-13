import "server-only";
import { isClerkEnabled } from "./auth";
import { SITE_URL } from "./site";

/**
 * Creates a Clerk invitation so a buyer can set up their client account
 * (workflow step 2). Guarded: a no-op when Clerk is not configured. Idempotent
 * from our side via ignoreExisting; a duplicate invitation is treated as success.
 * Returns true if an invitation was created or already existed.
 */
export async function inviteClient(email: string): Promise<boolean> {
  if (!isClerkEnabled) {
    console.info("[clerk] invite skipped (Clerk not configured) email=", email);
    return false;
  }
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${SITE_URL}/portal`,
      publicMetadata: { role: "client" },
      ignoreExisting: true,
    });
    return true;
  } catch (err) {
    // Do not surface internals; log a short message without secrets.
    console.error(
      "[clerk] invite failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return false;
  }
}
