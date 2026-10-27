import { NextResponse, type NextRequest } from "next/server";
import { checkApprovalToken } from "@/lib/trail-crew-approval-link";
import { setStatus } from "@/lib/launch-qa-db";

/**
 * POST /api/launch/qa/review  { token, id, status }
 *
 * The teacher approving or hiding a report from /play/review. The signed
 * link is the credential, and only a "qa" link is accepted here.
 */
export const dynamic = "force-dynamic";

const STATUSES = new Set(["approved", "hidden", "pending"]);
const UUID = /^[0-9a-f-]{36}$/i;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const checked = checkApprovalToken(typeof body.token === "string" ? body.token : null);
  if (!checked.ok || checked.claims.scope !== "qa") {
    return NextResponse.json({ error: "This review link has expired. Ask for a new one at /play/teacher." }, { status: 403 });
  }
  if (typeof body.id !== "string" || !UUID.test(body.id) || typeof body.status !== "string" || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const ok = await setStatus(body.id, body.status as "approved" | "hidden" | "pending");
  if (!ok) return NextResponse.json({ error: "Could not save that. Try again." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
