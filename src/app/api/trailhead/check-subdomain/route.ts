import { NextResponse, type NextRequest } from "next/server";
import { validateSubdomain } from "@/lib/trailhead";
import { isSubdomainAvailable } from "@/lib/trailhead-db";

/**
 * GET /api/trailhead/check-subdomain?name=chosen-name
 * Live subdomain availability check for the intake form.
 */
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim().toLowerCase();
  if (!name) {
    return NextResponse.json({ available: false, error: "Name is required." }, { status: 400 });
  }

  const validation = validateSubdomain(name);
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error }, { status: 200 });
  }

  try {
    const available = await isSubdomainAvailable(name);
    return NextResponse.json({ available, error: available ? null : "That name is already taken." });
  } catch {
    // Supabase not configured: report available so the form works in dev
    return NextResponse.json({ available: true, error: null });
  }
}
