import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Who may see Race Day.
 *
 * The site is for the class only, so it is locked by two shared secrets held
 * in the server environment rather than by accounts: a class password for
 * students and a teacher code for the admin screen. The teacher code opens the
 * student pages too.
 *
 * Unlike the showcase console, this fails closed. With no password set, the
 * pages stay locked and say what to configure, so a preview deployment can
 * never show race data to the open web by accident.
 *
 * Each cookie holds an HMAC of a fixed label keyed by the secret itself, so it
 * cannot be forged without the secret, and changing the secret signs everyone
 * out. No student identity is stored anywhere in this flow.
 */

export type Role = "class" | "teacher";

const COOKIE: Record<Role, string> = { class: "race_day_class", teacher: "race_day_teacher" };
const ENV: Record<Role, string> = { class: "RACE_DAY_CLASS_PASSWORD", teacher: "RACE_DAY_TEACHER_CODE" };
/** A school day, then sign in again. */
export const MAX_AGE_S = 60 * 60 * 8;

function secret(role: Role): string | null {
  const value = process.env[ENV[role]]?.trim();
  return value ? value : null;
}

export function isConfigured(role: Role): boolean {
  return secret(role) !== null;
}

export function envName(role: Role): string {
  return ENV[role];
}

export function cookieName(role: Role): string {
  return COOKIE[role];
}

function token(role: Role, key: string): string {
  return createHmac("sha256", key).update(`race-day:${role}`).digest("hex");
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Checks a typed password. Returns the cookie value to set when it is right. */
export function checkSecret(role: Role, attempt: string): string | null {
  const key = secret(role);
  if (!key || !same(attempt.trim(), key)) return null;
  return token(role, key);
}

async function holds(role: Role): Promise<boolean> {
  const key = secret(role);
  if (!key) return false;
  const value = (await cookies()).get(COOKIE[role])?.value;
  return !!value && same(value, token(role, key));
}

export async function isTeacher(): Promise<boolean> {
  return holds("teacher");
}

/**
 * The sub day switch. RACE_DAY_OPEN=1 opens every class page (leaderboard,
 * lesson, reflection) with no password, for a day when a substitute runs the
 * class. Teacher pages still need the teacher code. Delete the setting and
 * redeploy to lock the class pages again.
 */
export function isOpenToAll(): boolean {
  return process.env.RACE_DAY_OPEN?.trim() === "1";
}

export async function isInClass(): Promise<boolean> {
  return isOpenToAll() || (await holds("class")) || (await holds("teacher"));
}
