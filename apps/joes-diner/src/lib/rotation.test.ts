import { test } from "node:test";
import assert from "node:assert/strict";
import { harness } from "./test-helpers";
import { nextUp, total } from "./rotation";

function threeServers() {
  const h = harness();
  h.run({ type: "open_shift" });
  h.run({ type: "server_join", staffId: "s1", name: "Ann" });
  h.minutes(1);
  h.run({ type: "server_join", staffId: "s2", name: "Bea" });
  h.minutes(1);
  h.run({ type: "server_join", staffId: "s3", name: "Cal" });
  return h;
}

function seatParty(h: ReturnType<typeof harness>, size: number, seat: string, serverId?: string) {
  const r = h.run({ type: "check_in", name: `P${size}${seat}`, size, choice: "any", source: "staff", allHere: true });
  h.run({ type: "seat", visitId: r.visitId!, seatCodes: [seat], serverId });
  h.minutes(1);
  return r.visitId!;
}

test("the lowest running total gets the next party (the clipboard example)", () => {
  const h = threeServers();
  // Build 24 / 22 / 24 like the brief's example.
  seatParty(h, 4, "101"); // Ann 4
  seatParty(h, 4, "102"); // Bea 4
  seatParty(h, 4, "103"); // Cal 4
  const totals = () => Object.fromEntries(h.state.servers.map((s) => [s.name, total(s)]));
  assert.deepEqual(totals(), { Ann: 4, Bea: 4, Cal: 4 });
  // Large party goes to whoever is next (Ann), then Bea and Cal catch up.
  seatParty(h, 7, "105");
  assert.equal(totals().Ann, 11);
  assert.equal(nextUp(h.state.servers)?.name, "Bea");
});

test("ties go to whoever was seated longest ago", () => {
  const h = threeServers();
  seatParty(h, 2, "101"); // Ann
  seatParty(h, 2, "102"); // Bea
  seatParty(h, 2, "103"); // Cal
  assert.equal(nextUp(h.state.servers)?.name, "Ann");
});

test("a server joining mid-shift starts tied with the lowest total, not at zero", () => {
  const h = threeServers();
  seatParty(h, 4, "101"); // Ann 4
  seatParty(h, 6, "105"); // Bea 6
  seatParty(h, 3, "103"); // Cal 3
  h.run({ type: "server_join", staffId: "s4", name: "Dee" });
  const dee = h.state.servers.find((s) => s.staffId === "s4")!;
  assert.equal(dee.offset, 3);
  assert.equal(dee.actual, 0);
  // Cal (3, seated earlier) still goes before Dee (3, just joined).
  assert.equal(nextUp(h.state.servers)?.name, "Cal");
});

test("paused servers are skipped and keep their total", () => {
  const h = threeServers();
  h.run({ type: "server_pause", staffId: "s1" });
  assert.equal(nextUp(h.state.servers)?.name, "Bea");
  seatParty(h, 2, "101");
  h.run({ type: "server_resume", staffId: "s1" });
  assert.equal(total(h.state.servers.find((s) => s.staffId === "s1")!), 0);
  assert.equal(nextUp(h.state.servers)?.name, "Ann");
});

test("an override counts toward the chosen server and is recorded", () => {
  const h = threeServers();
  const r = h.run({ type: "check_in", name: "Regulars", size: 2, choice: "any", source: "staff", allHere: true });
  const seated = h.run({ type: "seat", visitId: r.visitId!, seatCodes: ["101"], serverId: "s3" });
  assert.equal(h.state.servers.find((s) => s.staffId === "s3")!.actual, 2);
  const assigned = seated.events.find((e) => e.type === "server_assigned")!;
  assert.equal(assigned.data?.override, true);
});

test("undoing a seating takes the guests back off the count", () => {
  const h = threeServers();
  const id = seatParty(h, 4, "101");
  h.run({ type: "undo_seat", visitId: id });
  assert.equal(h.state.servers.find((s) => s.staffId === "s1")!.actual, 0);
  assert.equal(h.state.visits[0].status, "waiting");
});

test("a server who leaves is out of the rotation but keeps their count", () => {
  const h = threeServers();
  seatParty(h, 4, "101");
  h.run({ type: "server_leave", staffId: "s1" });
  const ann = h.state.servers.find((s) => s.staffId === "s1")!;
  assert.equal(ann.actual, 4);
  assert.notEqual(nextUp(h.state.servers)?.name, "Ann");
});
