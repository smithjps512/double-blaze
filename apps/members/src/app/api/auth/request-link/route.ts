import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { getAdminClient } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";

/**
 * POST /api/auth/request-link
 *
 * Email sign-in. There is no password: for a professional association the
 * simplest credential that works is a link to an address the club is going to
 * verify anyway, and it removes password storage, resets, and reuse from the
 * threat model entirely.
 *
 * The link is generated server-side and delivered by Resend rather than by
 * Supabase's built-in mailer. Three reasons, in order of weight: it sends from
 * the club's verified domain rather than a supabase.co address, so it survives
 * spam filters and looks like the organization it claims to be; failures reach
 * the bounce webhook, so a member who never received their link is visible
 * rather than silent; and Supabase's default mailer is rate limited to a
 * handful per hour, which a real membership would exhaust on day one.
 *
 * The emailed link points at this app, not at Supabase, so the whole flow
 * stays on the club's own hostname.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same shape as the platform's send helper. If a third copy appears, extract a package. */
const FROM_ADDRESS = process.env.EMAIL_FROM?.trim() || "yourteam@doubleblaze.solutions";
const REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || process.env.LEAD_TO_EMAIL?.trim();

function plausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant();
  if (!tenant) return NextResponse.json({ error: "Unknown site." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!plausibleEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const db = getAdminClient();
  if (!db) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });

  // Always answer the same way, whether or not this address has an account.
  // Distinguishing the two would turn this endpoint into a way to test which
  // members belong to a private club, which for a vetted professional body is
  // exactly the thing the vetting exists to prevent.
  const ok = NextResponse.json({
    ok: true,
    message: "If that address can sign in, a link is on its way.",
  });

  const origin = new URL(req.url).origin;

  try {
    const { data, error } = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/` },
    });

    // A user who does not exist yet is not an error worth surfacing: someone
    // signing in before applying is a normal first step, so create the identity
    // and send them onward to the join questionnaire.
    let hashedToken = data?.properties?.hashed_token;
    if (error || !hashedToken) {
      const created = await db.auth.admin.generateLink({
        type: "signup",
        email,
        password: crypto.randomUUID(),
        options: { redirectTo: `${origin}/` },
      });
      hashedToken = created.data?.properties?.hashed_token;
      if (!hashedToken) {
        console.error(`[members] could not generate a sign-in link for ${email}`);
        return ok;
      }
    }

    const linkType = data?.properties?.hashed_token ? "magiclink" : "signup";
    const url = `${origin}/api/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=${linkType}`;

    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn(`[members] sign-in link not sent (no RESEND_API_KEY) to=${email}`);
      return ok;
    }

    const resend = new Resend(key);
    const { error: sendError } = await resend.emails.send({
      from: `${tenant.name} <${FROM_ADDRESS}>`,
      to: [email],
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      subject: `Sign in to ${tenant.name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#132330">
          <h1 style="color:#0d2b45;font-size:20px">Sign in to ${escapeHtml(tenant.name)}</h1>
          <p>Use the link below to sign in. It works once and expires in an hour.</p>
          <p style="margin:28px 0">
            <a href="${url}" style="background:#2f9e6f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Sign in</a>
          </p>
          <p style="color:#5b6f7d;font-size:13px">
            If you did not ask to sign in, you can ignore this email and nothing will happen.
          </p>
        </div>`,
    });

    if (sendError) {
      console.error(`[members] sign-in email failed to=${email}: ${sendError.message}`);
    }
  } catch (err) {
    console.error("[members] request-link failed:", err);
  }

  return ok;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
