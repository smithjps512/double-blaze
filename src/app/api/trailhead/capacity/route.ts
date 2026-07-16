import { NextResponse } from "next/server";
import { getCapacity } from "@/lib/trailhead-db";
import { TRAILHEAD_MONTHLY_CAP } from "@/lib/trailhead";

/**
 * GET /api/trailhead/capacity
 * Returns the current month's capacity for the live counter.
 */
export async function GET() {
  try {
    const capacity = await getCapacity();
    return NextResponse.json(capacity);
  } catch {
    // Supabase not configured: return full capacity for dev
    return NextResponse.json({
      used: 0,
      remaining: TRAILHEAD_MONTHLY_CAP,
      cap: TRAILHEAD_MONTHLY_CAP,
      full: false,
    });
  }
}
