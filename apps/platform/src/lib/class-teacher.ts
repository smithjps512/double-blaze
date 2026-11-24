/**
 * Who may use the class tools behind a sign-in: the Trail Crew queue and the
 * Smart Cities teacher page in the execution portal, and the API routes they
 * call.
 *
 * Staff roles are for Double Blaze work and are about to be handed to business
 * partners. Student work is the teacher's alone, so these tools check a named
 * list of teacher emails instead of the role. Only a verified email on the
 * signed-in Clerk account counts, so nobody can add the teacher's address to
 * their own account to get in.
 *
 * The list is CLASS_TEACHER_EMAILS, comma separated. Unset means nobody: the
 * class tools fail closed rather than falling back to every staff login.
 * The signed email links from the Trail Crew queue do not go through this;
 * they already reach only the teacher's inbox.
 */

export type AccountEmail = { address: string; verified: boolean };

export function parseTeacherEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export function isTeacherAccount(emails: AccountEmail[], allowed: string[]): boolean {
  if (allowed.length === 0) return false;
  return emails.some((e) => e.verified && allowed.includes(e.address.trim().toLowerCase()));
}
