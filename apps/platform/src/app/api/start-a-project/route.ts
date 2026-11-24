import { NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND } from "@/lib/brand";
import { INTERNAL_INBOX } from "@/lib/email";
import {
  describeIntake,
  parseIntake,
  routeIntake,
  validateIntake,
} from "@/lib/intake";

export const runtime = "nodejs";

/**
 * "Tell us about your needs" intake. Validates the request, routes it to the
 * selected practice group(s) (see lib/intake.ts), and emails it. The next step
 * is a free discovery call, which leads to a proposal.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot caught a bot: pretend success, send nothing.
  if (typeof body.company_website === "string" && body.company_website) {
    return NextResponse.json({ ok: true });
  }

  const input = parseIntake(body);
  const invalid = validateIntake(input);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const to = routeIntake(input.practices, process.env, INTERNAL_INBOX);
  const d = describeIntake(input);
  const row = (k: string, v: string) =>
    v ? `<p><strong>${k}:</strong> ${escapeHtml(v)}</p>` : "";

  const html = `
    <h2>New discovery request</h2>
    ${row("Name", input.name)}
    ${row("Email", input.email)}
    ${row("Phone", input.phone)}
    ${row("Organization", input.organization)}
    ${row("Role", input.role)}
    ${row("Organization type", d.orgType)}
    ${row("Practice areas", d.practices.join(", ") || "None selected")}
    ${row("Looking to", d.needType)}
    ${row("Timeline", d.timeline)}
    ${row("Solicitation or contract", input.solicitation)}
    <p><strong>Their needs:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br/>")}</p>
    <p style="color:#75787B">Routed to: ${escapeHtml(to.join(", "))}. Next step: book the free discovery call.</p>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  // Without a Resend key (e.g. local dev) accept the request but skip sending,
  // so the form is fully testable. Configure RESEND_API_KEY in production.
  if (!apiKey) {
    console.info("[intake] request received (email not sent, no RESEND_API_KEY):", {
      orgType: input.orgType,
      practices: input.practices,
      to,
    });
    return NextResponse.json({ ok: true, emailed: false });
  }

  const from = process.env.EMAIL_FROM?.trim() || BRAND.email;
  const subjectPractices = d.practices.length ? d.practices.join(", ") : "General";
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Double Blaze <${from}>`,
      to,
      replyTo: input.email,
      subject: `Discovery request: ${input.organization} (${subjectPractices})`,
      html,
    });
    if (error) {
      console.error("[intake] Resend error:", error);
      return NextResponse.json(
        { error: "We could not send your request. Please email us directly." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, emailed: true });
  } catch (err) {
    console.error("[intake] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please email us directly." },
      { status: 500 },
    );
  }
}
