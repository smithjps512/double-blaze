import { NextResponse } from "next/server";
import { loadResponses, requireAdmin } from "@/lib/admin";
import { applyFilters, toCsv } from "@/lib/summary";

export const dynamic = "force-dynamic";

/** GET /admin/export?level=&lot=&interest= : the filtered table as CSV. */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Admins only.", { status: 403 });

  const params = new URL(req.url).searchParams;
  const { rows, error } = await loadResponses(admin.db);
  if (error) return new NextResponse("Could not read responses.", { status: 500 });

  const filtered = applyFilters(rows, {
    level: params.get("level") ?? undefined,
    lot: params.get("lot") ?? undefined,
    interest: params.get("interest") ?? undefined,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + toCsv(filtered), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paint-your-spot-interest-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
