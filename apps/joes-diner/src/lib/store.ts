import "server-only";
import { randomUUID } from "node:crypto";
import { newToken } from "./tokens";
import { ConflictError } from "./errors";
import { businessDate } from "./defaults";
import { apply, FloorError, type Action, type Result } from "./floor";
import { memoryStore } from "./store-memory";
import { supabaseStore } from "./store-supabase";
import type { FloorState, Staff, Visit } from "./types";

/**
 * Where the floor lives. With Supabase configured, the shared database (see
 * supabase/migrations/0058_joes_diner.sql). Without it, an in-memory demo
 * floor with invented sample data, so the app can be clicked through locally
 * and shown to Joe's before anything is set up.
 */

export type DeviceRole = "checkin" | "staff" | "table" | "kitchen" | "bell";

export interface Device {
  id: string;
  label: string;
  role: DeviceRole;
  seatCode: string | null;
}

export interface Store {
  demo: boolean;
  /** Today's floor, creating the day's shift if needed. */
  load(date: string): Promise<FloorState>;
  /** Save a change. Throws ConflictError if the floor changed since `prev` was loaded. */
  commit(prev: FloorState, result: Result): Promise<void>;
  /** Finished visits for learning typical turns. */
  history(days: number): Promise<Pick<Visit, "size" | "seatedAt" | "tableReadyAt">[]>;
  listStaff(): Promise<Staff[]>;
  addStaff(name: string, role: Staff["role"], code: string | null): Promise<Staff>;
  updateStaff(id: string, patch: { active?: boolean; code?: string | null; name?: string }): Promise<void>;
  /** The staff member whose code this is, if any. */
  staffByCode(code: string): Promise<Staff | null>;
  deviceByToken(token: string): Promise<Device | null>;
  pairDevice(input: { label: string; role: DeviceRole; seatCode: string | null }): Promise<{ device: Device; token: string }>;
  listDevices(): Promise<(Device & { lastSeenAt: string | null })[]>;
  revokeDevice(id: string): Promise<void>;
}

export { ConflictError } from "./errors";

export function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStore(): Store {
  return isConfigured() ? supabaseStore() : memoryStore();
}

export function today(now = Date.now()): string {
  return businessDate(now);
}

/**
 * Load, apply, save. If another tablet saved first, load again and retry,
 * so two people tapping at once never lose a change.
 */
export async function run(action: Action, deviceId?: string): Promise<{ state: FloorState; visitId?: string }> {
  const store = getStore();
  for (let attempt = 0; attempt < 4; attempt++) {
    const prev = await store.load(today());
    const result = apply(prev, action, {
      now: Date.now(),
      newId: randomUUID,
      newToken,
      deviceId: store.demo ? undefined : deviceId,
    });
    try {
      await store.commit(prev, result);
      return { state: result.state, visitId: result.visitId };
    } catch (e) {
      if (e instanceof ConflictError) continue;
      throw e;
    }
  }
  throw new FloorError("The floor is busy. Please try again.");
}
