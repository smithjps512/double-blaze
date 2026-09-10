import { NextResponse, type NextRequest } from "next/server";
import { loadSpecimens } from "@/lib/plant-id";

/**
 * GET /api/greenhouse/list?voter=<token>
 *
 * Everything the Name That Plant page draws. The voter token is the browser's
 * own random string and is used only to mark which slip this device voted for.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const voter = req.nextUrl.searchParams.get("voter") ?? "";
  return NextResponse.json({ specimens: await loadSpecimens(voter) });
}
