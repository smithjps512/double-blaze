"use server";

import { headers } from "next/headers";
import { isEmail, safeNext } from "@/lib/auth-rules";
import { sendSignInLink } from "@/lib/email";
import { getServiceClient } from "@/lib/supabase";

export interface LinkState {
  sentTo?: string;
  error?: string;
  email?: string;
}

/**
 * Emails a one-tap sign-in link, made on the server and sent through Resend
 * (Supabase's own mailer allows only a few emails an hour). Same pattern as
 * Paint Your Spot and the members app.
 */
export async function requestLink(_prev: LinkState, form: FormData): Promise<LinkState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(form.get("next") ?? ""));
  if (!isEmail(email)) return { error: "Enter a valid email address.", email };

  const db = getServiceClient();
  if (!db) return { error: "Sign in is not switched on in demo mode.", email };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = data?.properties?.hashed_token;
  const action = data?.properties?.action_link;
  if (error || !hashed || !action) {
    console.error("[find-me] could not make a sign-in link:", error?.message ?? "no token");
    return { error: "That did not work. Try again in a minute.", email };
  }
  // A brand new address is issued a signup token, not a magic link.
  const type = new URL(action).searchParams.get("type") ?? "magiclink";
  const url =
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(hashed)}` +
    `&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  const sent = await sendSignInLink(email, url);
  if (!sent) return { error: "We could not send the email. Try again in a minute.", email };
  return { sentTo: email };
}
