import "server-only";
import { NextResponse } from "next/server";
import { FloorError } from "./floor";
import { getStore, today } from "./store";
import type { FloorState } from "./types";
import { defaultTurns, learnedTurns, type Turns } from "./wait";

/** Shared helpers for the API routes. */

let cached: { at: number; history: Awaited<ReturnType<ReturnType<typeof getStore>["history"]>> } | null = null;

/** Typical turns, learned from the last 60 days once there is enough data. Refreshed every 10 minutes. */
export async function turnsFor(state: FloorState): Promise<Turns> {
  const store = getStore();
  if (store.demo) return defaultTurns(state.settings);
  if (!cached || Date.now() - cached.at > 10 * 60_000) {
    cached = { at: Date.now(), history: await store.history(60) };
  }
  return learnedTurns(state.settings, cached.history);
}

export async function loadToday(): Promise<FloorState> {
  return getStore().load(today());
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Turn a thrown error into a response staff can read. */
export function failure(e: unknown) {
  if (e instanceof FloorError) return fail(e.message, 409);
  console.error("[joes]", e);
  return fail("Something went wrong. Please try again.", 500);
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 60): string => (typeof v === "string" ? v.slice(0, max) : "");
export const int = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) ? v : Number.parseInt(String(v), 10));
