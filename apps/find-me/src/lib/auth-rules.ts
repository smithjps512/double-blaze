/**
 * Small pure helpers for auth and config. Tested without a server.
 */

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

/** A plausible email address. The real check is the emailed link. */
export function isEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) && raw.length <= 254;
}

/** Only same-site paths, so a crafted link cannot bounce someone elsewhere. */
export function safeNext(raw: string | null | undefined, fallback = "/my"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}
