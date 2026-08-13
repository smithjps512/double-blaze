import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";
import { getRegionBySlug } from "@/lib/regions";
import { setRegionStatus, setRegionLead } from "@/lib/regions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness gate admin toggle (task item 5). Staff-only. Flips a region's
 * status (coming_soon <-> active) and/or assigns its lead. A region should only
 * be set active once its lead is onboarded and delivery is confirmed (see
 * docs/REGIONS.md); this endpoint does not enforce that, it is the operator's
 * call.
 *
 * POST body: { slug, status?: "active" | "coming_soon", leadUserId?: string | null }
 */
interface AdminBody {
  slug?: string;
  status?: "active" | "coming_soon";
  leadUserId?: string | null;
}

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!isStaffRole(role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: AdminBody;
  try {
    body = (await req.json()) as AdminBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug || !getRegionBySlug(slug)) {
    return NextResponse.json({ error: "Unknown region." }, { status: 400 });
  }

  if (body.status && !["active", "coming_soon"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (body.status === undefined && body.leadUserId === undefined) {
    return NextResponse.json(
      { error: "Provide a status and/or leadUserId." },
      { status: 400 },
    );
  }

  let ok = true;
  if (body.leadUserId !== undefined) {
    ok = (await setRegionLead(slug, body.leadUserId)) && ok;
  }
  if (body.status !== undefined) {
    ok = (await setRegionStatus(slug, body.status)) && ok;
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Update failed. Is the database configured?" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, slug, status: body.status });
}
