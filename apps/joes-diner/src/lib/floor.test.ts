import { test } from "node:test";
import assert from "node:assert/strict";
import { harness } from "./test-helpers";
import { FloorError, seatsLabel } from "./floor";
import { seatState } from "./floor-view";

function ready() {
  const h = harness();
  h.run({ type: "open_shift" });
  h.run({ type: "server_join", staffId: "s1", name: "Ann" });
  return h;
}

test("every action writes at least one event and bumps the version", () => {
  const h = ready();
  const v0 = h.state.version;
  const r = h.run({ type: "check_in", name: "Smith", size: 4, choice: "any", source: "counter", allHere: true, quotedMinutes: 10 });
  assert.deepEqual(r.events.map((e) => e.type), ["checked_in", "wait_quoted"]);
  assert.equal(h.state.version, v0 + 1);
});

test("a full visit: check in, seat, food, guests left, table ready", () => {
  const h = ready();
  const id = h.run({ type: "check_in", name: "Smith", size: 4, choice: "table", source: "counter", allHere: true }).visitId!;
  h.minutes(5);
  h.run({ type: "seat", visitId: id, seatCodes: ["104"] });
  assert.equal(seatState(h.state, "104"), "seated");
  h.minutes(12);
  h.run({ type: "food_ready", seatCode: "104" });
  assert.equal(seatState(h.state, "104"), "food_ready");
  const ticket = h.state.tickets[0];
  h.run({ type: "food_picked_up", ticketId: ticket.id });
  assert.equal(seatState(h.state, "104"), "seated");
  h.minutes(30);
  h.run({ type: "guests_left", seatCode: "104" });
  assert.equal(seatState(h.state, "104"), "needs_bussing");
  h.minutes(3);
  h.run({ type: "table_ready", seatCode: "104", staffId: "s1" });
  assert.equal(seatState(h.state, "104"), "open");
  const v = h.state.visits[0];
  assert.equal(v.status, "done");
  assert.equal((v.firstFoodReadyAt! - v.seatedAt!) / 60_000, 12);
  assert.equal((v.tableReadyAt! - v.seatedAt!) / 60_000, 45);
});

test("table ready works without the guests-left pilot tap", () => {
  const h = ready();
  const id = h.run({ type: "check_in", name: "A", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  h.run({ type: "seat", visitId: id, seatCodes: ["101"] });
  h.run({ type: "table_ready", seatCode: "101", staffId: "s1" });
  assert.equal(seatState(h.state, "101"), "open");
  assert.equal(h.state.visits[0].guestsLeftAt, null);
});

test("seating at a taken seat is refused with a message for staff", () => {
  const h = ready();
  const a = h.run({ type: "check_in", name: "A", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  const b = h.run({ type: "check_in", name: "B", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  h.run({ type: "seat", visitId: a, seatCodes: ["101"] });
  assert.throws(() => h.run({ type: "seat", visitId: b, seatCodes: ["101"] }), (e: unknown) => e instanceof FloorError && /Table 101 is not open/.test(e.message));
});

test("a party larger than 7 can be seated across two tables", () => {
  const h = ready();
  const id = h.run({ type: "check_in", name: "Reunion", size: 10, choice: "table", source: "staff", allHere: true }).visitId!;
  h.run({ type: "seat", visitId: id, seatCodes: ["105", "106"] });
  assert.equal(seatState(h.state, "105"), "seated");
  assert.equal(seatState(h.state, "106"), "seated");
  h.run({ type: "table_ready", seatCode: "106", staffId: "s1" });
  assert.equal(seatState(h.state, "105"), "open");
});

test("a skipped party moves to second in line", () => {
  const h = ready();
  const a = h.run({ type: "check_in", name: "A", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  h.minutes(1);
  const b = h.run({ type: "check_in", name: "B", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  h.minutes(1);
  const c = h.run({ type: "check_in", name: "C", size: 2, choice: "table", source: "counter", allHere: true }).visitId!;
  h.run({ type: "call", visitId: a });
  h.run({ type: "skip", visitId: a });
  const line = h.state.visits.filter((v) => v.status === "waiting").sort((x, y) => x.queueAt - y.queueAt).map((v) => v.id);
  assert.deepEqual(line, [b, a, c]);
});

test("check-in needs the day open, a name, and a party size", () => {
  const h = harness();
  assert.throws(() => h.run({ type: "check_in", name: "A", size: 2, choice: "any", source: "qr", allHere: true }), FloorError);
  h.run({ type: "open_shift" });
  assert.throws(() => h.run({ type: "check_in", name: "  ", size: 2, choice: "any", source: "qr", allHere: true }), /name/);
  assert.throws(() => h.run({ type: "check_in", name: "A", size: 0, choice: "any", source: "qr", allHere: true }), /party size/);
});

test("closing the day takes everyone off the floor", () => {
  const h = ready();
  h.run({ type: "close_shift" });
  assert.ok(h.state.servers.every((s) => s.leftAt !== null));
});

test("seat labels read naturally", () => {
  assert.equal(seatsLabel(["104"]), "Table 104");
  assert.equal(seatsLabel(["bar5", "bar3", "bar4"]), "Bar 3 to 5");
  assert.equal(seatsLabel(["105", "106"]), "Tables 105 and 106");
});
