import { createHash, randomBytes } from "node:crypto";

export function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Staff codes are hashed with the staff id, so equal codes do not look equal. */
export function codeHash(staffId: string, code: string): string {
  return hash(`${staffId}:${code}`);
}

export function newToken(): string {
  return randomBytes(18).toString("base64url");
}

/** A 4-digit staff code. */
export function isCode(code: unknown): code is string {
  return typeof code === "string" && /^[0-9]{4}$/.test(code);
}
