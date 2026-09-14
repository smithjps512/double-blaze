import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/server-auth";
import { auth } from "@clerk/nextjs/server";
import { decideProposal } from "@/lib/trail-crew-decide";
import { checkApprovalToken } from "@/lib/trail-crew-approval-link";
import { tokenCovers } from "@/lib/trail-crew-approval-token";

/**
 * POST /api/trail-crew/decide
 *
 * Two doors, one decision. A signed-in staff member from the queue page, or
 * a signed token from the teacher's email that names this proposal (or the
 * whole queue). Either way the work is `decideProposal`.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "approve" ? "approve" : body.decision === "reject" ? "reject" : null;
  // The teacher may fix the wording before approving, which is usually the
  // right move with a first attempt from a twelve year old.
  const editedText = typeof body.text === "string" ? body.text.trim() : "";
  const token = typeof body.token === "string" ? body.token : "";

  if (!id || !decision) {
    return NextResponse.json({ error: "Missing id or decision." }, { status: 400 });
  }

  let decidedBy: string | null = null;
  if (token) {
    const checked = checkApprovalToken(token);
    if (checked.ok && tokenCovers(checked.claims, id)) decidedBy = "teacher (email link)";
  }
  if (!decidedBy) {
    if (!(await requireStaff())) {
      return NextResponse.json(
        { error: token ? "That link has expired or does not cover this proposal. Ask for a fresh one." : "Unauthorized" },
        { status: 401 },
      );
    }
    const { userId } = await auth();
    decidedBy = userId ?? "staff";
  }

  const outcome = await decideProposal({ id, decision, editedText, decidedBy });
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error ?? "Could not decide." }, { status: outcome.httpStatus ?? 500 });
  }
  return NextResponse.json(outcome);
}
