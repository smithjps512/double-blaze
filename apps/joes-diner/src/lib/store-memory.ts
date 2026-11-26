import "server-only";
import { randomUUID } from "node:crypto";
import { emptyFloor } from "./defaults";
import { ConflictError } from "./errors";
import { apply, type Action } from "./floor";
import type { Device, DeviceRole, Store } from "./store";
import { codeHash, hash, newToken } from "./tokens";
import type { FloorState, Staff } from "./types";

/**
 * Demo mode: one floor in memory, seeded with invented sample parties and
 * servers so every screen has something on it. Codes for the sample servers
 * are 1111, 2222, and 3333. Nothing is saved; restarting the app starts over.
 */

interface Memory {
  floors: Map<string, FloorState>;
  staff: (Staff & { codeHash: string | null })[];
  devices: (Device & { tokenHash: string; lastSeenAt: string | null; revoked: boolean })[];
}

const g = globalThis as unknown as { __joesMemory?: Memory };

function memory(): Memory {
  if (!g.__joesMemory) {
    const staff = [
      { id: "demo-dana", name: "Dana (sample)", role: "server" as const, active: true, code: "1111" },
      { id: "demo-marcus", name: "Marcus (sample)", role: "server" as const, active: true, code: "2222" },
      { id: "demo-rita", name: "Rita (sample)", role: "server" as const, active: true, code: "3333" },
      { id: "demo-sam", name: "Sam (sample)", role: "server" as const, active: true, code: "4444" },
    ].map(({ code, ...s }) => ({ ...s, codeHash: codeHash(s.id, code) }));
    g.__joesMemory = { floors: new Map(), staff, devices: [] };
  }
  return g.__joesMemory;
}

/** A believable mid-morning: most tables full, a short line, food at the pass. */
function seeded(date: string): FloorState {
  const minute = 60_000;
  let now = Date.now() - 50 * minute;
  let state = emptyFloor(`demo-${date}`, date);
  const step = (action: Action) => {
    const r = apply(state, action, { now, newId: randomUUID, newToken });
    state = r.state;
    return r.visitId;
  };
  const wait = (m: number) => {
    now += m * minute;
  };
  step({ type: "open_shift" });
  step({ type: "server_join", staffId: "demo-dana", name: "Dana (sample)" });
  step({ type: "server_join", staffId: "demo-marcus", name: "Marcus (sample)" });
  step({ type: "server_join", staffId: "demo-rita", name: "Rita (sample)" });

  const seat = (name: string, size: number, codes: string[], choice: "table" | "bar_ok" | "any" = "table") => {
    const id = step({ type: "check_in", name, size, choice, source: "counter", allHere: true })!;
    step({ type: "seat", visitId: id, seatCodes: codes });
    wait(3);
    return id;
  };
  seat("Alvarez", 4, ["101"]);
  seat("Brooks", 2, ["102"]);
  seat("Chen", 6, ["105"]);
  seat("Dawson", 3, ["103"]);
  seat("Evans", 2, ["bar1", "bar2"], "bar_ok");
  step({ type: "food_ready", seatCode: "101" });
  seat("Foster", 4, ["104"]);
  seat("Garcia", 2, ["106"]);
  seat("Hughes", 1, ["bar5"], "bar_ok");
  seat("Iverson", 4, ["107"]);
  wait(5);
  step({ type: "guests_left", seatCode: "102" });
  seat("Jackson", 2, ["108"]);
  seat("Kim", 3, ["109"]);
  wait(4);
  step({ type: "food_ready", seatCode: "103" });
  step({ type: "food_ready", seatCode: "105" });
  state.tickets.filter((t) => t.seatCode === "101").forEach((t) => (t.pickedUpAt = now));
  wait(2);
  step({ type: "check_in", name: "Lopez", size: 2, choice: "any", source: "counter", allHere: true, quotedMinutes: 10 });
  wait(1);
  step({ type: "check_in", name: "Murphy", size: 5, choice: "table", source: "qr", allHere: false, quotedMinutes: 20 });
  wait(1);
  step({ type: "check_in", name: "Nguyen", size: 3, choice: "bar_ok", source: "counter", allHere: true, quotedMinutes: 5 });
  wait(1);
  step({ type: "check_in", name: "Owens", size: 2, choice: "table", source: "qr", allHere: true, quotedMinutes: 15 });
  state.version = 1;
  return state;
}

export function memoryStore(): Store {
  const m = memory();
  return {
    demo: true,
    async load(date) {
      if (!m.floors.has(date)) m.floors.set(date, seeded(date));
      return structuredClone(m.floors.get(date)!);
    },
    async commit(prev, result) {
      const current = m.floors.get(prev.businessDate);
      if (current && current.version !== prev.version) {
        throw new ConflictError("stale");
      }
      m.floors.set(prev.businessDate, structuredClone(result.state));
    },
    async history() {
      return [];
    },
    async listStaff() {
      return m.staff.map(({ codeHash: _h, ...s }) => s);
    },
    async addStaff(name, role, code) {
      const id = randomUUID();
      const s = { id, name, role, active: true, codeHash: code ? codeHash(id, code) : null };
      m.staff.push(s);
      return { id, name, role, active: true };
    },
    async updateStaff(id, patch) {
      const s = m.staff.find((x) => x.id === id);
      if (!s) return;
      if (patch.active !== undefined) s.active = patch.active;
      if (patch.name) s.name = patch.name;
      if (patch.code !== undefined) s.codeHash = patch.code ? codeHash(id, patch.code) : null;
    },
    async staffByCode(code) {
      const s = m.staff.find((x) => x.active && x.codeHash === codeHash(x.id, code));
      return s ? { id: s.id, name: s.name, role: s.role, active: s.active } : null;
    },
    async deviceByToken(token) {
      const d = m.devices.find((x) => !x.revoked && x.tokenHash === hash(token));
      if (!d) return null;
      d.lastSeenAt = new Date().toISOString();
      return { id: d.id, label: d.label, role: d.role, seatCode: d.seatCode };
    },
    async pairDevice(input: { label: string; role: DeviceRole; seatCode: string | null }) {
      const token = newToken();
      const device = { id: randomUUID(), ...input };
      m.devices.push({ ...device, tokenHash: hash(token), lastSeenAt: null, revoked: false });
      return { device, token };
    },
    async listDevices() {
      return m.devices.filter((d) => !d.revoked).map(({ tokenHash: _t, revoked: _r, ...d }) => d);
    },
    async revokeDevice(id) {
      const d = m.devices.find((x) => x.id === id);
      if (d) d.revoked = true;
    },
  };
}
