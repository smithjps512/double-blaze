"use server";

import { headers } from "next/headers";
import { isStaffEmail, safeNext } from "@/lib/auth-rules";
import { sendSignInLink } from "@/lib/email";
import { getServiceClient } from "@/lib/supabase";

export interface LinkState {
  sentTo?: string;
  error?: string;
  /** What was typed, so a rejected form comes back filled in. */
  email?: string;
}

/**
 * Emails a one-tap sign-in link. Used instead of Google sign-in because the
 * MCPS Google Workspace blocks outside apps until district IT approves them.
 *
 * The link is made on the server and sent by Resend from the verified Double
 * Blaze domain, the same pattern as the members app: Supabase's own mailer is
 * limited to a handful of emails an hour.
 */
export async function requestLink(_prev: LinkState, form: FormData): Promise<LinkState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(form.get("next") ?? ""));
  if (!isStaffEmail(email)) return { error: "Use your @mcps.org school email.", email };

  const db = getServiceClient();
  if (!db) return { error: "Sign in is not switched on yet. Check back soon.", email };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "https://paintyourspot.doubleblaze.solutions";

  // A brand new address gets an account here. Supabase then issues the token
  // as a signup confirmation rather than a magic link, so read the type it
  // actually issued from the action link instead of assuming.
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = data?.properties?.hashed_token;
  const action = data?.properties?.action_link;
  if (error || !hashed || !action) {
    console.error("[paint-your-spot] could not make a sign-in link:", error?.message ?? "no token");
    return { error: "That did not work. Try again in a minute.", email };
  }
  const type = new URL(action).searchParams.get("type") ?? "magiclink";
  const url =
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(hashed)}` +
    `&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  const sent = await sendSignInLink(email, url);
  if (!sent) return { error: "We could not send the email. Try again in a minute.", email };
  return { sentTo: email };
}
