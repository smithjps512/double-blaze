import { access } from "@/lib/auth";
import type { Action } from "@/lib/floor";
import { body, fail, failure, int, json, loadToday, str, turnsFor } from "@/lib/service";
import { getStore, run } from "@/lib/store";
import { isCode } from "@/lib/tokens";
import { staffView } from "@/lib/views";

/** The staff screen behind the bar: read the floor, and do anything on it. */

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await access(["staff"]);
  if (!a.ok) return fail("This tablet is not set up for the staff screen.", 401);
  try {
    const state = await loadToday();
    const staff = await getStore().listStaff();
    return json(staffView(state, staff, await turnsFor(state), Date.now()));
  } catch (e) {
    return failure(e);
  }
}

const CHOICES = new Set(["table", "bar_ok", "any"]);

export async function POST(req: Request) {
  const a = await access(["staff"]);
  if (!a.ok) return fail("This tablet is not set up for the staff screen.", 401);
  const b = await body(req);
  const type = str(b.type, 30);
  const visitId = str(b.visitId, 60);
  const store = getStore();
  let action: Action;
  try {
    switch (type) {
      case "open_shift":
      case "close_shift":
        action = { type };
        break;
      case "server_join": {
        const s = (await store.listStaff()).find((x) => x.id === str(b.staffId, 60) && x.active);
        if (!s) return fail("Pick a server from the list.");
        action = { type, staffId: s.id, name: s.name };
        break;
      }
      case "server_pause":
      case "server_resume":
      case "server_leave":
        action = { type, staffId: str(b.staffId, 60) };
        break;
      case "check_in": {
        const choice = str(b.choice, 10);
        action = {
          type,
          name: str(b.name, 40),
          size: int(b.size),
          choice: CHOICES.has(choice) ? (choice as "table" | "bar_ok" | "any") : "any",
          source: "staff",
          allHere: b.allHere !== false,
        };
        break;
      }
      case "set_all_here":
        action = { type, visitId, allHere: Boolean(b.allHere) };
        break;
      case "call":
      case "skip":
      case "undo_seat":
      case "no_show":
      case "leave_list":
        action = { type, visitId };
        break;
      case "seat": {
        const codes = Array.isArray(b.seatCodes) ? b.seatCodes.map((c) => str(c, 10)).filter(Boolean) : [];
        action = { type, visitId, seatCodes: codes, serverId: str(b.serverId, 60) || null };
        break;
      }
      case "guests_left":
        action = { type, seatCode: str(b.seatCode, 10) };
        break;
      case "table_ready": {
        if (!isCode(b.code)) return fail("Enter your 4-digit code.");
        const who = await store.staffByCode(b.code);
        if (!who) return fail("That code does not match anyone. Try again.");
        action = { type, seatCode: str(b.seatCode, 10), staffId: who.id };
        break;
      }
      default:
        return fail("Unknown action.");
    }
    const r = await run(action, a.device?.id);
    return json({ ok: true, visitId: r.visitId, version: r.state.version });
  } catch (e) {
    return failure(e);
  }
}
