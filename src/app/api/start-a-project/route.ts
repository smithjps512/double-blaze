import { NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND } from "@/lib/brand";
import { getRegionBySlug } from "@/lib/regions";
import { getRegionLeadEmail } from "@/lib/regions-db";

export const runtime = "nodejs";

interface LeadPayload {
  name?: string;
  email?: string;
  business?: string;
  interest?: string;
  message?: string;
  /** Region slug the lead came from (routes the email to the region lead). */
  region?: string;
  /** Honeypot: real users leave this empty. */
  company_website?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  let body: LeadPayload;
  try {
    body = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot caught a bot: pretend success, send nothing.
  if (body.company_website) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const business = body.business?.trim() ?? "";
  const interest = body.interest?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const region = body.region ? getRegionBySlug(body.region.trim()) : null;

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and a short message are required." },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEADS_FROM_EMAIL ?? BRAND.email;
  const central = process.env.LEADS_TO_EMAIL ?? BRAND.email;
  // Route to the region's lead when the region is active and has an onboarded
  // lead; coming_soon (or unassigned) regions fall back to the central inbox
  // (task item 4).
  const leadEmail = region ? await getRegionLeadEmail(region.slug) : null;
  const to = leadEmail ?? central;

  const html = `
    <h2>New start-a-project request</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${business ? `<p><strong>Business:</strong> ${escapeHtml(business)}</p>` : ""}
    ${region ? `<p><strong>Region:</strong> ${escapeHtml(region.name)}</p>` : ""}
    ${interest ? `<p><strong>Interested in:</strong> ${escapeHtml(interest)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
  `;

  // Without a Resend key (e.g. local dev) accept the lead but skip sending,
  // so the form is fully testable. Configure RESEND_API_KEY in production.
  if (!apiKey) {
    console.info("[start-a-project] lead received (email not sent, no RESEND_API_KEY):", {
      name,
      email,
      business,
      interest,
      region: region?.slug ?? null,
    });
    return NextResponse.json({ ok: true, emailed: false });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Double Blaze Leads <${from}>`,
      to: [to],
      replyTo: email,
      subject: `New project request from ${name}`,
      html,
    });
    if (error) {
      console.error("[start-a-project] Resend error:", error);
      return NextResponse.json(
        { error: "We could not send your request. Please email us directly." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, emailed: true });
  } catch (err) {
    console.error("[start-a-project] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please email us directly." },
      { status: 500 },
    );
  }
}
