import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken, updateSiteStatus } from "@/lib/trailhead-db";

/**
 * POST /api/trailhead/upgrade
 * Customer initiates an upgrade from Trailhead to a paid tier. One click:
 * sets the site status to 'upgraded', removes the footer credit, and
 * redirects them to the appropriate checkout. Content carries forward.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  const targetTier = String(body.tier ?? "green");

  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  const validTiers = ["green", "blue", "black", "double_black"];
  if (!validTiers.includes(targetTier)) {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }

  const site = await getSiteByPreviewToken(token);
  if (!site) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  // Mark as upgraded and remove footer credit
  await updateSiteStatus(site.id, "upgraded", { footer_credit: false });

  // Redirect to the checkout for the chosen tier
  return NextResponse.json({
    ok: true,
    checkoutUrl: `/checkout/${targetTier}`,
    message: "Your content will carry forward to the new package.",
  });
}
