import "server-only";

/**
 * "Made by" credits, kept out of the repo (which is public).
 *
 * SANDWICH_BOT_CREDITS is a JSON object of scene ID to first name or initials,
 * set in Vercel: {"sub-001":"S.","sub-002":"J.K."}. Only read on the server
 * after the class password check, so a credit never reaches a locked page.
 * Anything that is not a short plain name is ignored.
 */
export function credits(): Record<string, string> {
  const raw = process.env.SANDWICH_BOT_CREDITS?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [id, name] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof name === "string" && /^[\p{L} .'-]{1,24}$/u.test(name.trim())) out[id] = name.trim();
    }
    return out;
  } catch {
    return {};
  }
}

export function creditFor(id: string): string | null {
  if (id.startsWith("sample")) return "Sample";
  return credits()[id] ?? null;
}
