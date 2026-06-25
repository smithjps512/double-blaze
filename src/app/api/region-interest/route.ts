import { NextResponse } from "next/server";
import { BRAND } from "@/lib/brand";
import { getRegionBySlug } from "@/lib/regions";
import { recordRegionInterest, getRegionLeadEmail } from "@/lib/regions-db";
import { sendRegionInterest } from "@/lib/email";

export const runtime = "nodejs";

interface InterestPayload {
  slug?: string;
  name?: string;
  email?: string;
  message?: string;
  /** Honeypot: real users leave this empty. */
  company_website?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: InterestPayload;
  try {
    body = (await request.json()) as InterestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot caught a bot: pretend success, do nothing.
  if (body.company_website) {
    return NextResponse.json({ ok: true });
  }

  const slug = body.slug?.trim() ?? "";
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  const region = getRegionBySlug(slug);
  if (!region) {
    return NextResponse.json({ error: "Unknown region." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // Store the interest (guarded: no-op without Supabase).
  await recordRegionInterest({
    slug,
    name: name || null,
    email,
    message: message || null,
  });

  // Route the notification: the region's onboarded lead when active, otherwise
  // the central inbox (coming_soon regions have no lead yet).
  const leadEmail = await getRegionLeadEmail(slug);
  const to = leadEmail ?? process.env.LEADS_TO_EMAIL ?? BRAND.email;
  await sendRegionInterest(to, {
    regionName: region.name,
    name,
    email,
    message: message || undefined,
  });

  return NextResponse.json({ ok: true });
}
