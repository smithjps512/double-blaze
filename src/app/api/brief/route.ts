import { NextResponse } from "next/server";
import { getOwnedProject } from "@/lib/portal";
import { acceptBrief, requestBriefChanges } from "@/lib/brief-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BriefBody {
  projectId?: string;
  action?: "accept" | "request_changes";
  notes?: string;
}

/**
 * Brief acceptance and change-request endpoint (spec section 5 step 4). The
 * signed-in client either accepts the brief (which generates deliverables,
 * creates the kickoff, assigns the lead, and notifies both sides) or requests
 * changes (which has Spark revise and bumps the revision). Both paths are
 * idempotent and scoped to the caller's organization.
 */
export async function POST(req: Request) {
  let body: BriefBody;
  try {
    body = (await req.json()) as BriefBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const projectId = body.projectId?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "Missing project." }, { status: 400 });
  }

  const owned = await getOwnedProject(projectId);
  if (!owned) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const { appUser, project } = owned;

  if (body.action === "accept") {
    const result = await acceptBrief({ appUser, project });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Could not accept the brief. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, status: "accepted" });
  }

  if (body.action === "request_changes") {
    const notes = (body.notes ?? "").trim();
    if (!notes) {
      return NextResponse.json(
        { error: "Please describe the changes you would like." },
        { status: 400 },
      );
    }
    const result = await requestBriefChanges({ appUser, project, notes });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Could not submit your changes. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, revised: result.revised });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
