import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/auth";

/**
 * GET /api/auth/callback
 *
 * Where the emailed sign-in link lands. The token hash is exchanged for a
 * session here, server-side, so the session cookie is set with HttpOnly and
 * never passes through JavaScript. That is the reason the link points at this
 * route rather than at Supabase's own verify endpoint, which returns tokens in
 * a URL fragment that only client-side code can read.
 *
 * Verification consumes the token, so a link works exactly once.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Token types a sign-in link can legitimately carry.
 *
 * Which one arrives depends on the state of the account when the link was
 * generated: a confirmed member gets `magiclink`, a brand new one gets
 * `signup`, because creating the identity and confirming it are the same step.
 */
const VERIFIABLE = ["magiclink", "signup", "email"] as const;
type VerifiableType = (typeof VERIFIABLE)[number];

function isVerifiable(value: string | null): value is VerifiableType {
  return value !== null && (VERIFIABLE as readonly string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const failed = (reason: string) =>
    NextResponse.redirect(new URL(`/sign-in?error=${reason}`, url.origin));

  if (!tokenHash || !isVerifiable(type)) return failed("invalid");

  const db = await getSessionClient();
  if (!db) return failed("unconfigured");

  // Try the type the link declares, then the others.
  //
  // A token is only consumed by a verification that succeeds, so a failed
  // attempt costs nothing and this cannot burn a member's link. It exists
  // because a mismatch between the type issued and the type verified reports
  // itself as "One-time token not found", which reaches a member as a link
  // that expired the moment it arrived. That is a miserable thing to debug
  // from the outside, and cheap to be robust against from in here.
  const attempts: VerifiableType[] = [type, ...VERIFIABLE.filter((t) => t !== type)];

  let lastError = "";
  for (const attempt of attempts) {
    const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type: attempt });
    if (!error) {
      if (attempt !== type) {
        // Worth knowing about: the link said one thing and another was true.
        console.warn(
          `[members] sign-in link declared type=${type} but verified as ${attempt}`,
        );
      }
      return NextResponse.redirect(new URL("/", url.origin));
    }
    lastError = error.message;
  }

  // Genuinely expired, already used, or tampered with. All the same to a
  // visitor: ask for a new link.
  console.warn(`[members] sign-in verification failed for all types: ${lastError}`);
  return failed("expired");
}
