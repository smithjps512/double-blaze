import { access, clientKey, limited } from "@/lib/auth";
import { body, fail, failure, int, json, loadToday, str, turnsFor } from "@/lib/service";
import { run } from "@/lib/store";
import type { SeatingChoice } from "@/lib/types";
import { checkinView } from "@/lib/views";
import { quote, quoteForChoice } from "@/lib/wait";
import { findVisit } from "@/lib/floor-view";

/**
 * Guest check-in. The counter tablet (a paired check-in device) sees the
 * waitlist by name, like a list on the wall inside the diner. The public QR
 * page sees only the waits and how many parties are ahead, never names.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await access(["checkin", "staff"]);
  try {
    const state = await loadToday();
    const view = checkinView(state, await turnsFor(state), Date.now());
    if (!a.ok) return json({ ...view, line: view.line.map((l) => ({ ...l, name: "" })), nowSeating: [] });
    return json(view);
  } catch (e) {
    return failure(e);
  }
}

const CHOICES = new Set(["table", "bar_ok", "any"]);

export async function POST(req: Request) {
  const a = await access(["checkin", "staff"]);
  const counter = a.ok;
  if (!counter && limited(`checkin:${await clientKey()}`, 5, 10 * 60_000)) {
    return fail("Too many check-ins from this phone. Please see our staff at the front.", 429);
  }
  const b = await body(req);
  const choice = str(b.choice, 10);
  const size = int(b.size);
  if (!CHOICES.has(choice)) return fail("Please choose table or bar.");
  try {
    const state = await loadToday();
    const turns = await turnsFor(state);
    const minutes = Number.isInteger(size) && size > 0 ? quoteForChoice(quote(state, size, turns, Date.now()), choice as SeatingChoice) : null;
    const r = await run(
      {
        type: "check_in",
        name: str(b.name, 40),
        size,
        choice: choice as SeatingChoice,
        source: counter ? "counter" : "qr",
        allHere: b.allHere !== false,
        quotedMinutes: minutes,
      },
      a.device?.id,
    );
    const v = r.visitId ? findVisit(r.state, r.visitId) : null;
    return json({ ok: true, token: v?.token, minutes });
  } catch (e) {
    return failure(e);
  }
}
