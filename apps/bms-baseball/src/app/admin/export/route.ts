import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { GRADES, POSITIONS } from "@/lib/signup";
import { applyFilters, toCsv, type SignupRow } from "@/lib/summary";
import { getServiceClient, TABLE } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return new NextResponse("Not signed in", { status: 401 });
  const db = getServiceClient();
  if (!db) return new NextResponse("Database not connected", { status: 503 });

  const { data, error } = await db.from(TABLE).select("*").order("last_name").order("first_name");
  if (error) return new NextResponse(error.message, { status: 500 });

  const g = Number(req.nextUrl.searchParams.get("grade"));
  const p = req.nextUrl.searchParams.get("position") ?? "";
  const rows = applyFilters((data ?? []) as SignupRow[], {
    grade: GRADES.includes(g as 6) ? g : undefined,
    position: POSITIONS.some((x) => x.id === p) ? p : undefined,
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bms-baseball-signups-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
