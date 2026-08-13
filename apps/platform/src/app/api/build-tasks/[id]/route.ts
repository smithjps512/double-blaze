import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isClerkEnabled, isStaffRole, type Role } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getAppUserOrg } from "@/lib/trail-run-build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["not_started", "in_progress", "done"]);

interface PatchBody {
  status?: string;
  notes?: string;
}

/**
 * Updates a build task's status and/or notes. Staff only (project_lead, admin).
 * Part of the internal build workspace (Sprint T2). Clients can never reach
 * build_tasks (RLS denies them) and this route also gates on staff role.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isClerkEnabled) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const db = getSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Not available." }, { status: 503 });

  const appUser = await getAppUserOrg(db, userId);
  if (!isStaffRole((appUser?.role as Role | null) ?? null)) {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.notes !== undefined) {
    update.notes = body.notes;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await db.from("build_tasks").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not update the task." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
