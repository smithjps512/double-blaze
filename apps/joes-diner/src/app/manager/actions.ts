"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkManagerCode, clearManagerCookie, clientKey, isManager, limited, screenFor, setDeviceCookie, setManagerCookie } from "@/lib/auth";
import { getStore, type DeviceRole } from "@/lib/store";
import { isCode } from "@/lib/tokens";

/** Manager actions: sign in, staff and codes, pairing tablets. */

async function guard() {
  if (!(await isManager())) redirect("/manager");
}

export async function signIn(form: FormData) {
  if (limited(`mgr:${await clientKey()}`, 8, 15 * 60_000)) redirect("/manager?e=wait");
  if (!checkManagerCode(String(form.get("code") ?? ""))) redirect("/manager?e=code");
  await setManagerCookie();
  redirect("/manager");
}

export async function signOut() {
  await clearManagerCookie();
  redirect("/manager");
}

async function codeTaken(code: string, exceptId?: string): Promise<boolean> {
  const who = await getStore().staffByCode(code);
  return Boolean(who && who.id !== exceptId);
}

export async function addStaff(form: FormData) {
  await guard();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const role = String(form.get("role") ?? "server") as "server" | "cook" | "manager";
  const code = String(form.get("code") ?? "").trim();
  if (!name) redirect("/manager?e=name");
  if (code && !isCode(code)) redirect("/manager?e=format");
  if (code && (await codeTaken(code))) redirect("/manager?e=taken");
  await getStore().addStaff(name, ["server", "cook", "manager"].includes(role) ? role : "server", code || null);
  revalidatePath("/manager");
  redirect("/manager?ok=staff");
}

export async function setCode(form: FormData) {
  await guard();
  const id = String(form.get("id") ?? "");
  const code = String(form.get("code") ?? "").trim();
  if (!isCode(code)) redirect("/manager?e=format");
  if (await codeTaken(code, id)) redirect("/manager?e=taken");
  await getStore().updateStaff(id, { code });
  revalidatePath("/manager");
  redirect("/manager?ok=code");
}

export async function setActive(form: FormData) {
  await guard();
  await getStore().updateStaff(String(form.get("id") ?? ""), { active: form.get("active") === "1" });
  revalidatePath("/manager");
  redirect("/manager");
}

const ROLES: DeviceRole[] = ["checkin", "staff", "table", "kitchen", "bell"];

/** Pair the tablet this form is submitted from. */
export async function pairThisDevice(form: FormData) {
  await guard();
  const role = String(form.get("role") ?? "") as DeviceRole;
  if (!ROLES.includes(role)) redirect("/manager?e=role");
  const seat = role === "table" ? String(form.get("seat") ?? "") : null;
  if (role === "table" && !/^1(0[1-9]|10)$/.test(seat ?? "")) redirect("/manager?e=seat");
  const label = role === "table" ? `Table ${seat}` : { checkin: "Check-in counter", staff: "Staff screen", kitchen: "Kitchen", bell: "Bell monitor", table: "" }[role];
  const { device, token } = await getStore().pairDevice({ label, role, seatCode: seat });
  await setDeviceCookie(token);
  redirect(screenFor(device));
}

export async function revoke(form: FormData) {
  await guard();
  await getStore().revokeDevice(String(form.get("id") ?? ""));
  revalidatePath("/manager");
  redirect("/manager");
}
