import { body, fail, failure, json, loadToday, str, turnsFor } from "@/lib/service";
import { findByToken } from "@/lib/floor-view";
import { run } from "@/lib/store";
import { partyView } from "@/lib/views";

/** A guest's own party, by its private link. */

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const state = await loadToday();
    const v = findByToken(state, token);
    if (!v) return fail("We could not find your spot on today's list.", 404);
    return json(partyView(state, v, await turnsFor(state), Date.now()));
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await body(req);
  try {
    const state = await loadToday();
    const v = findByToken(state, token);
    if (!v) return fail("We could not find your spot on today's list.", 404);
    const what = str(b.action, 20);
    if (what === "leave") await run({ type: "leave_list", visitId: v.id });
    else if (what === "all_here") await run({ type: "set_all_here", visitId: v.id, allHere: true });
    else return fail("Unknown action.");
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
