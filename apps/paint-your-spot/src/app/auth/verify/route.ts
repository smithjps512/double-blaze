import { NextResponse, type NextRequest } from "next/server";
import { isStaffEmail, safeNext } from "@/lib/auth-rules";
import { getSessionClient } from "@/lib/supabase";
import { syncProfile, viewerFromUser } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * POST /auth/verify (form fields token_hash, type, next)
 *
 * Turns the emailed token into a session and checks @mcps.org again. Only
 * reachable by pressing the button on /auth/confirm: school email scanners
 * open every link in a message to check it, and if opening the link spent the
 * one-time token, staff would find it "already used" when they tapped it.
 * Scanners open links; they do not submit forms.
 */
const TYPES = ["magiclink", "signup", "email"] as const;
type LinkType = (typeof TYPES)[number];

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const form = await req.formData();
  const field = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  };
  const tokenHash = field("token_hash");
  const declared = field("type");
  const next = safeNext(field("next"));
  // 303 so the browser follows with a GET, not a second POST.
  const go = (path: string) => NextResponse.redirect(new URL(path, origin), { status: 303 });
  const fail = (reason: string) => go(`/sign-in?error=${reason}&next=${encodeURIComponent(next)}`);

  if (!tokenHash) return fail("signin");
  const db = await getSessionClient();
  if (!db) return fail("signin");

  // Try the declared type first, then the others. A failed attempt does not
  // consume the token, and a type mismatch otherwise reads as "expired".
  const first = (TYPES as readonly string[]).includes(declared ?? "") ? (declared as LinkType) : "magiclink";
  const attempts: LinkType[] = [first, ...TYPES.filter((t) => t !== first)];
  for (const type of attempts) {
    const { data, error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error || !data.user) continue;
    if (!isStaffEmail(data.user.email)) {
      await db.auth.signOut();
      return fail("domain");
    }
    const viewer = viewerFromUser(data.user);
    if (viewer) await syncProfile(viewer);
    return go(next);
  }
  return fail("expired");
}
