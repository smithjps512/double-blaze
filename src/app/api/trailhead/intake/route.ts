import { NextResponse, after, type NextRequest } from "next/server";
import { validateSubdomain, MAX_PAGES, isPlausibleEmail } from "@/lib/trailhead";
import {
  submitIntake,
  createSiteRecord,
  getCapacity,
  storeIntakeFlags,
  recordNotificationFailure,
} from "@/lib/trailhead-db";
import {
  sendTrailheadIntakeNotification,
  sendTrailheadConfirmation,
  sendTrailheadContentReview,
  type EmailResult,
} from "@/lib/email";
import { scanIntakeForFlags } from "@/lib/spark-trailhead";
import { generateDraft } from "@/lib/trailhead-pipeline";
import { SITE_URL } from "@/lib/site";

/** Build the single durable status URL for a site's lifecycle token. */
function statusUrl(token: string): string {
  return `${SITE_URL}/trailhead/status/${token}`;
}

/**
 * Simple in-memory rate limiting per IP. Resets on deploy, which is fine for
 * a 10-build-per-month program. The monthly capacity cap is the real guard.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // max 5 intake submissions per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

/**
 * POST /api/trailhead/intake
 * Submit the Trailhead intake form.
 */
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: if filled, silently accept but do nothing
  if (body.website && String(body.website).trim() !== "") {
    return NextResponse.json({ ok: true, id: "received" });
  }

  // Validate required fields
  const siteName = String(body.site_name ?? "").trim();
  const subdomain = String(body.subdomain ?? "").trim().toLowerCase();
  const siteType = String(body.site_type ?? "").trim();
  const orgType = String(body.org_type ?? "").trim();
  const contactEmail = String(body.contact_email ?? "").trim();
  const contactName = String(body.contact_name ?? "").trim();
  const needsPayments = Boolean(body.needs_payments);

  if (!siteName || !subdomain || !contactEmail || !contactName) {
    return NextResponse.json(
      { ok: false, error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  // Permissive email check so an obviously-broken address is caught before we
  // hand it to Resend. Plus-addressing (name+test@gmail.com) is accepted.
  if (!isPlausibleEmail(contactEmail)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!["marketing", "member"].includes(siteType)) {
    return NextResponse.json(
      { ok: false, error: "Please select a site type." },
      { status: 400 },
    );
  }

  // Qualification gate: if they need payments, route to Green Trail
  if (needsPayments) {
    return NextResponse.json({
      ok: false,
      error: "qualification_gate",
      message: "It sounds like you need to take payments online. Green Trail ($199/mo) includes ecommerce, checkout, and scheduling. Trailhead does not include payment collection.",
      upgradeUrl: "/pricing",
    });
  }

  // Subdomain validation
  const validation = validateSubdomain(subdomain);
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  // Pages validation
  const pages = Array.isArray(body.pages) ? body.pages : ["home"];
  if (pages.length > MAX_PAGES) {
    return NextResponse.json(
      { ok: false, error: `Maximum ${MAX_PAGES} pages allowed.` },
      { status: 400 },
    );
  }
  if (!pages.includes("home")) {
    pages.unshift("home");
  }

  // Member fee gate
  if (siteType === "member" && body.member_fee === "yes") {
    return NextResponse.json({
      ok: false,
      error: "qualification_gate",
      message: "Trailhead does not handle member dues or paid memberships. Our paid packages include that. Would you like to see the options?",
      upgradeUrl: "/pricing",
    });
  }

  // Check capacity
  try {
    const capacity = await getCapacity();
    if (capacity.full) {
      return NextResponse.json({
        ok: false,
        error: "capacity_full",
        message: "This month's builds are full. Join the waitlist and we will reach out when the next month opens.",
      });
    }
  } catch {
    // Supabase not configured, proceed in dev
  }

  // --- Step 1: persist the intake (must-succeed) ---
  let intakeId: string;
  try {
    const result = await submitIntake({
      site_name: siteName,
      subdomain,
      site_type: siteType as "marketing" | "member",
      org_type: orgType,
      org_type_other: body.org_type_other ? String(body.org_type_other) : undefined,
      contact_email: contactEmail,
      contact_name: contactName,
      pitch: body.pitch ? String(body.pitch) : undefined,
      audience: body.audience ? String(body.audience) : undefined,
      primary_action: body.primary_action ? String(body.primary_action) : undefined,
      primary_action_other: body.primary_action_other ? String(body.primary_action_other) : undefined,
      differentiator: body.differentiator ? String(body.differentiator) : undefined,
      pages: pages.map(String),
      logo_choice: body.logo_choice ? String(body.logo_choice) : undefined,
      photos_choice: body.photos_choice ? String(body.photos_choice) : undefined,
      copy_choice: body.copy_choice ? String(body.copy_choice) : undefined,
      hours: body.hours ? String(body.hours) : undefined,
      location: body.location ? String(body.location) : undefined,
      social_links: body.social_links ? String(body.social_links) : undefined,
      must_see: body.must_see ? String(body.must_see) : undefined,
      member_join_method: body.member_join_method ? String(body.member_join_method) : undefined,
      member_fee: body.member_fee ? String(body.member_fee) : undefined,
      member_private_area: body.member_private_area ? String(body.member_private_area) : undefined,
      member_roster: body.member_roster ? String(body.member_roster) : undefined,
      template: body.template ? String(body.template) : undefined,
      colors: body.colors ? String(body.colors) : undefined,
      inspiration_url: body.inspiration_url ? String(body.inspiration_url) : undefined,
      tone: body.tone ? String(body.tone) : undefined,
      contact_form_email: body.contact_form_email ? String(body.contact_form_email) : undefined,
      show_phone: Boolean(body.show_phone),
      phone: body.phone ? String(body.phone) : undefined,
      show_address: Boolean(body.show_address),
      address: body.address ? String(body.address) : undefined,
      freetext_anything_else: body.freetext_anything_else ? String(body.freetext_anything_else) : undefined,
      freetext_not_asked: body.freetext_not_asked ? String(body.freetext_not_asked) : undefined,
    });

    if (!result.ok) {
      if (result.error === "subdomain_taken") {
        return NextResponse.json(
          { ok: false, error: "That subdomain is already taken. Please choose another." },
          { status: 409 },
        );
      }
      if (result.error === "capacity_full") {
        return NextResponse.json({
          ok: false,
          error: "capacity_full",
          message: "This month's builds just filled up. Join the waitlist for next month.",
        });
      }
      console.error("[trailhead] intake submit returned error:", result.error);
      return NextResponse.json(
        { ok: false, error: "Something went wrong. Your answers have not been lost. Please try again in a moment." },
        { status: 500 },
      );
    }

    intakeId = result.id!;
  } catch (err) {
    console.error("[trailhead] intake submit threw:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Your answers have not been lost. Please try again in a moment." },
      { status: 500 },
    );
  }

  // --- Step 2: create site record (best-effort, logged) ---
  // The site record carries the lifecycle token. If it fails we can still
  // return the intake id, but the customer will not get a status URL.
  let siteId: string | null = null;
  let statusToken: string | null = null;
  try {
    const ref = await createSiteRecord(intakeId, subdomain);
    if (ref) {
      siteId = ref.id;
      statusToken = ref.token;
    }
  } catch (err) {
    console.error("[trailhead] site record creation failed (intake saved):", err);
  }

  // A best-effort email whose failure is logged at error level with the intake
  // id and recorded on the site record, so a dropped notification is never
  // invisible. Never throws into the request path.
  const trackEmail = (send: Promise<EmailResult>, tag: string): Promise<void> =>
    send
      .then(async (result) => {
        if (!result.ok) {
          console.error(
            `[trailhead] email ${tag} failed for intake ${intakeId}: ${result.reason ?? "unknown reason"}`,
          );
          if (siteId) {
            await recordNotificationFailure(siteId, tag, result.reason ?? "unknown reason");
          }
        }
      })
      .catch(async (err: unknown) => {
        const reason = err instanceof Error ? err.message : "threw during send";
        console.error(`[trailhead] email ${tag} threw for intake ${intakeId}: ${reason}`);
        if (siteId) await recordNotificationFailure(siteId, tag, reason);
      });

  // --- Step 3: emails, flag scan, and auto-draft (best-effort) ---
  // These run in `after()` so Vercel keeps the function alive until they finish.
  // A bare fire-and-forget promise is frozen the moment the response is sent,
  // which was silently dropping the Spark auto-draft (the whole build never
  // started) and could drop notifications too. `after()` awaits the work
  // without holding up the customer's response.
  after(async () => {
    const scanAndStore = scanIntakeForFlags(body)
      .then((flags) => {
        if (flags.length > 0) {
          return storeIntakeFlags(intakeId, flags).catch((err: unknown) =>
            console.error("[trailhead] flag store failed:", err),
          );
        }
      })
      .catch((err: unknown) => console.error("[trailhead] flag scan failed:", err));

    // Automatically start the content draft (brief section 4: Spark drafts, then
    // the customer reviews). A Spark hiccup must not cost the customer their
    // submission, and staff can re-run it. On success this also sends the
    // content-review email.
    const draftAndNotify = generateDraft(intakeId)
      .then((result) => {
        if (!result.ok) {
          console.warn(`[trailhead] auto-draft for intake ${intakeId} did not run: ${result.error}`);
          return;
        }
        if (result.contactEmail && result.token) {
          return trackEmail(
            sendTrailheadContentReview(result.contactEmail, {
              contactName: result.contactName ?? contactName,
              siteName: result.siteName ?? siteName,
              statusUrl: statusUrl(result.token),
            }),
            "trailhead-content-review",
          );
        }
      })
      .catch((err: unknown) => console.error("[trailhead] auto-draft threw:", err));

    await Promise.allSettled([
      trackEmail(
        sendTrailheadIntakeNotification({
          siteName,
          subdomain,
          contactName,
          contactEmail,
          siteType,
          intakeId,
        }),
        "trailhead-intake-internal",
      ),
      statusToken
        ? trackEmail(
            sendTrailheadConfirmation(contactEmail, {
              contactName,
              siteName,
              subdomain,
              statusUrl: statusUrl(statusToken),
            }),
            "trailhead-confirmation",
          )
        : Promise.resolve(),
      scanAndStore,
      draftAndNotify,
    ]);
  });

  return NextResponse.json({
    ok: true,
    id: intakeId,
    token: statusToken,
    statusUrl: statusToken ? statusUrl(statusToken) : null,
  });
}
