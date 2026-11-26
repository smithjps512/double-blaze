import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { changes } from "./diff";
import { ConflictError } from "./errors";
import type { Device, DeviceRole, Store } from "./store";
import { codeHash, hash, newToken } from "./tokens";
import type { FloorState, Seat, Settings, ShiftServer, Staff, Ticket, Visit } from "./types";

/**
 * The real store: Joe's floor in the shared Supabase database, read and
 * written only with the service role from the app's server. Every write to
 * the floor goes through jd_commit (one transaction, rejects stale writes).
 */

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function check<T>(r: { data: T; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`[joes] ${what}: ${r.error.message}`);
  return r.data;
}

const ms = (t: string | null): number | null => (t ? Date.parse(t) : null);
const iso = (t: number | null): string | null => (t === null ? null : new Date(t).toISOString());

/* eslint-disable @typescript-eslint/no-explicit-any */

function settingsFromRow(r: any): Settings {
  return {
    holdSeconds: r.hold_seconds,
    protectLargeTables: r.protect_large_tables,
    turnMinutes: { small: r.turn_small_minutes, medium: r.turn_medium_minutes, large: r.turn_large_minutes },
    resetMinutes: r.reset_minutes,
    menuUrl: r.menu_url,
    reviewUrl: r.review_url,
  };
}

function visitFromRow(r: any, seats: string[]): Visit {
  return {
    id: r.id,
    token: r.token,
    name: r.name,
    size: r.party_size,
    choice: r.seating_choice,
    source: r.source,
    phone: r.phone,
    textConsent: r.text_consent,
    status: r.status,
    allHere: r.all_here,
    checkedInAt: ms(r.checked_in_at)!,
    queueAt: Number(r.queue_at),
    quotedMinutes: r.quoted_minutes,
    calledAt: ms(r.called_at),
    seatedAt: ms(r.seated_at),
    serverId: r.server_id,
    override: r.server_override,
    seatCodes: seats,
    firstFoodReadyAt: ms(r.first_food_ready_at),
    guestsLeftAt: ms(r.guests_left_at),
    tableReadyAt: ms(r.table_ready_at),
    readyBy: r.ready_by,
    endedAt: ms(r.ended_at),
  };
}

function visitToRow(v: Visit) {
  return {
    id: v.id,
    token: v.token,
    name: v.name,
    party_size: v.size,
    seating_choice: v.choice,
    source: v.source,
    phone: v.phone,
    text_consent: v.textConsent,
    status: v.status,
    all_here: v.allHere,
    checked_in_at: iso(v.checkedInAt),
    queue_at: v.queueAt,
    quoted_minutes: v.quotedMinutes,
    called_at: iso(v.calledAt),
    seated_at: iso(v.seatedAt),
    server_id: v.serverId,
    server_override: v.override,
    first_food_ready_at: iso(v.firstFoodReadyAt),
    guests_left_at: iso(v.guestsLeftAt),
    table_ready_at: iso(v.tableReadyAt),
    ready_by: v.readyBy,
    ended_at: iso(v.endedAt),
    seat_codes: v.seatCodes,
  };
}

function serverFromRow(r: any): ShiftServer {
  return {
    staffId: r.staff_id,
    name: r.name,
    joinedAt: ms(r.joined_at)!,
    leftAt: ms(r.left_at),
    offset: r.start_offset,
    actual: r.actual_guests,
    paused: r.paused,
    lastSeatedAt: ms(r.last_seated_at),
  };
}

function staffFromRow(r: any): Staff {
  return { id: r.id, name: r.name, role: r.role, active: r.active };
}

function deviceFromRow(r: any): Device {
  return { id: r.id, label: r.label, role: r.role, seatCode: r.seat_code };
}

export function supabaseStore(): Store {
  return {
    demo: false,

    async load(date) {
      const d = db();
      await d.from("jd_shifts").upsert({ business_date: date }, { onConflict: "business_date", ignoreDuplicates: true });
      const [settings, seats, shift] = await Promise.all([
        d.from("jd_settings").select("*").eq("id", true).single(),
        d.from("jd_seats").select("*").order("kind").order("position"),
        d.from("jd_shifts").select("*").eq("business_date", date).single(),
      ]);
      const s = check(shift, "shift") as any;
      const [servers, visits] = await Promise.all([
        d.from("jd_shift_servers").select("*").eq("shift_id", s.id),
        d.from("jd_visits").select("*, jd_visit_seats(seat_code)").eq("shift_id", s.id),
      ]);
      const visitIds = ((check(visits, "visits") as any[]) ?? []).map((v) => v.id);
      const tickets = visitIds.length
        ? await d.from("jd_tickets").select("*").in("visit_id", visitIds)
        : { data: [], error: null };
      return {
        shiftId: s.id,
        businessDate: date,
        openedAt: ms(s.opened_at),
        closedAt: ms(s.closed_at),
        version: s.version,
        settings: settingsFromRow(check(settings, "settings")),
        seats: (check(seats, "seats") as any[]).map(
          (r): Seat => ({ code: r.code, kind: r.kind, capacity: r.capacity, position: r.position, active: r.active }),
        ),
        servers: (check(servers, "servers") as any[]).map(serverFromRow),
        visits: (check(visits, "visits") as any[]).map((r) =>
          visitFromRow(r, (r.jd_visit_seats ?? []).map((x: any) => x.seat_code)),
        ),
        tickets: (check(tickets, "tickets") as any[]).map(
          (r): Ticket => ({
            id: r.id,
            visitId: r.visit_id,
            seatCode: r.seat_code,
            readyAt: ms(r.ready_at)!,
            pickedUpAt: ms(r.picked_up_at),
          }),
        ),
      };
    },

    async commit(prev: FloorState, result) {
      const next = result.state;
      const c = changes(prev, next);
      const { error } = await db().rpc("jd_commit", {
        p_shift: prev.shiftId,
        p_expected: prev.version,
        p_shift_row: { opened_at: iso(next.openedAt), closed_at: iso(next.closedAt) },
        p_servers: c.servers.map((s) => ({
          staff_id: s.staffId,
          name: s.name,
          joined_at: iso(s.joinedAt),
          left_at: iso(s.leftAt),
          start_offset: s.offset,
          actual_guests: s.actual,
          paused: s.paused,
          last_seated_at: iso(s.lastSeatedAt),
        })),
        p_visits: c.visits.map(visitToRow),
        p_tickets: c.tickets.map((t) => ({
          id: t.id,
          visit_id: t.visitId,
          seat_code: t.seatCode,
          ready_at: iso(t.readyAt),
          picked_up_at: iso(t.pickedUpAt),
        })),
        p_events: result.events.map((e) => ({
          type: e.type,
          occurred_at: iso(e.at),
          visit_id: e.visitId ?? null,
          seat_codes: e.seatCodes ?? [],
          staff_id: e.staffId ?? null,
          device_id: e.deviceId ?? null,
          data: e.data ?? {},
        })),
      });
      if (error) {
        if (/jd_conflict/.test(error.message)) throw new ConflictError("stale");
        throw new Error(`[joes] commit: ${error.message}`);
      }
    },

    async history(days) {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const rows = check(
        await db().from("jd_visits").select("party_size, seated_at, table_ready_at").gte("table_ready_at", since).limit(5000),
        "history",
      ) as any[];
      return rows.map((r) => ({ size: r.party_size, seatedAt: ms(r.seated_at), tableReadyAt: ms(r.table_ready_at) }));
    },

    async listStaff() {
      return (check(await db().from("jd_staff").select("*").order("name"), "staff") as any[]).map(staffFromRow);
    },

    async addStaff(name, role, code) {
      const id = randomUUID();
      const row = check(
        await db()
          .from("jd_staff")
          .insert({ id, name, role, code_hash: code ? codeHash(id, code) : null })
          .select()
          .single(),
        "add staff",
      );
      return staffFromRow(row);
    },

    async updateStaff(id, patch) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.active !== undefined) row.active = patch.active;
      if (patch.name) row.name = patch.name;
      if (patch.code !== undefined) row.code_hash = patch.code ? codeHash(id, patch.code) : null;
      check(await db().from("jd_staff").update(row).eq("id", id), "update staff");
    },

    async staffByCode(code) {
      const rows = check(await db().from("jd_staff").select("*").eq("active", true), "staff") as any[];
      const hit = rows.find((r) => r.code_hash && r.code_hash === codeHash(r.id, code));
      return hit ? staffFromRow(hit) : null;
    },

    async deviceByToken(token) {
      const row = check(
        await db().from("jd_devices").select("*").eq("token_hash", hash(token)).is("revoked_at", null).maybeSingle(),
        "device",
      );
      if (!row) return null;
      // Last seen, at most once a minute, for the morning "which tablets are up" check.
      const seen = ms((row as any).last_seen_at);
      if (!seen || Date.now() - seen > 60_000) {
        await db().from("jd_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", (row as any).id);
      }
      return deviceFromRow(row);
    },

    async pairDevice(input: { label: string; role: DeviceRole; seatCode: string | null }) {
      const token = newToken();
      const row = check(
        await db()
          .from("jd_devices")
          .insert({ label: input.label, role: input.role, seat_code: input.seatCode, token_hash: hash(token) })
          .select()
          .single(),
        "pair device",
      );
      return { device: deviceFromRow(row), token };
    },

    async listDevices() {
      const rows = check(await db().from("jd_devices").select("*").is("revoked_at", null).order("label"), "devices") as any[];
      return rows.map((r) => ({ ...deviceFromRow(r), lastSeenAt: r.last_seen_at }));
    },

    async revokeDevice(id) {
      check(await db().from("jd_devices").update({ revoked_at: new Date().toISOString() }).eq("id", id), "revoke device");
    },
  };
}
