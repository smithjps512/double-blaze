import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getStore, type Device, type DeviceRole } from "./store";

/**
 * Who is asking.
 *
 *  - Tablets carry a device cookie set when a manager paired them. The token
 *    is stored hashed; the device has only its own screen's permissions.
 *  - The manager signs in with the manager code (JOES_MANAGER_CODE) and gets
 *    a signed cookie. The manager can use every screen.
 *  - Guests have no sign-in. Their party's private link is their key.
 *
 * In demo mode (no Supabase), every screen is open so the app can be shown.
 */

export const DEVICE_COOKIE = "jd_device";
export const MANAGER_COOKIE = "jd_mgr";
const YEAR = 400 * 24 * 60 * 60;

function secret(): string {
  return process.env.JOES_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "joes-demo-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function managerCodeIsSet(): boolean {
  return Boolean(process.env.JOES_MANAGER_CODE);
}

export function checkManagerCode(code: string): boolean {
  const expected = process.env.JOES_MANAGER_CODE;
  if (!expected) return getStore().demo;
  return same(code.trim(), expected);
}

export async function setManagerCookie(): Promise<void> {
  const issued = String(Date.now());
  (await cookies()).set(MANAGER_COOKIE, `${issued}.${sign(`manager:${issued}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearManagerCookie(): Promise<void> {
  (await cookies()).delete(MANAGER_COOKIE);
}

export async function isManager(): Promise<boolean> {
  if (getStore().demo) return true;
  const raw = (await cookies()).get(MANAGER_COOKIE)?.value;
  if (!raw) return false;
  const [issued, mac] = raw.split(".");
  if (!issued || !mac || !same(mac, sign(`manager:${issued}`))) return false;
  return Date.now() - Number(issued) < 30 * 24 * 60 * 60 * 1000;
}

export async function setDeviceCookie(token: string): Promise<void> {
  (await cookies()).set(DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  });
}

export async function currentDevice(): Promise<Device | null> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return null;
  return getStore().deviceByToken(token);
}

export interface Access {
  ok: boolean;
  device: Device | null;
  manager: boolean;
}

/** Can this request use a screen with one of these roles? */
export async function access(roles: DeviceRole[]): Promise<Access> {
  const store = getStore();
  if (store.demo) return { ok: true, device: null, manager: true };
  const manager = await isManager();
  const device = await currentDevice();
  return { ok: manager || Boolean(device && roles.includes(device.role)), device, manager };
}

/** Where a paired tablet belongs. */
export function screenFor(device: Device): string {
  switch (device.role) {
    case "staff":
      return "/staff";
    case "checkin":
      return "/checkin";
    case "table":
      return `/table/${device.seatCode}`;
    case "kitchen":
      return "/kitchen";
    case "bell":
      return "/bell";
  }
}

/** Best-effort client address for rate limiting public check-ins. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

const hits = new Map<string, number[]>();

/** A simple sliding-window limit, per server instance. */
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
