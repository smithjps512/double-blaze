/**
 * Who may do what. Pure, so it is tested without a server.
 */

export const STAFF_DOMAIN = "mcps.org";

/** Exactly @mcps.org. Not a subdomain, not a lookalike. */
export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const at = email.trim().toLowerCase().lastIndexOf("@");
  if (at < 1) return false;
  return email.trim().toLowerCase().slice(at + 1) === STAFF_DOMAIN;
}

/** Parses a comma or whitespace separated email list from config. */
export function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[\s,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function inList(list: string[], email: string | null | undefined): boolean {
  return Boolean(email) && list.includes(email!.trim().toLowerCase());
}

/** Only same-site paths, so a crafted link cannot bounce someone elsewhere. */
export function safeNext(raw: string | null | undefined, fallback = "/interest"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}
