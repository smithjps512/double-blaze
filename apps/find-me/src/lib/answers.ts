import "server-only";
import { cookies } from "next/headers";
import { parseAnswers, type Answers } from "./quiz";
import { getViewer } from "./viewer";

/**
 * Where an adopter's quiz answers live. Nobody has to sign in to see their
 * matches: answers sit in a cookie until they sign in, then in
 * fm_adopter_answers (under RLS), and the cookie is copied up at that point.
 */

const COOKIE = "fm_answers";

export async function loadAnswers(): Promise<Answers | null> {
  const { viewer, db } = await getViewer();
  if (viewer && db) {
    const { data } = await db.from("fm_adopter_answers").select("answers").eq("user_id", viewer.id).maybeSingle();
    if (data) return parseAnswers((data as { answers: unknown }).answers);
  }
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return parseAnswers(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveAnswers(answers: Answers): Promise<void> {
  (await cookies()).set(COOKIE, JSON.stringify(answers), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  const { viewer, db } = await getViewer();
  if (viewer && db) {
    const { error } = await db
      .from("fm_adopter_answers")
      .upsert({ user_id: viewer.id, answers, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) console.error("[find-me] save answers:", error.message);
  }
}

/** After sign in: keep answers given while signed out, unless the account already has some. */
export async function adoptCookieAnswers(userId: string, db: NonNullable<Awaited<ReturnType<typeof getViewer>>["db"]>) {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return;
  let answers: Answers;
  try {
    answers = parseAnswers(JSON.parse(raw));
  } catch {
    return;
  }
  const { data } = await db.from("fm_adopter_answers").select("user_id").eq("user_id", userId).maybeSingle();
  if (!data) await db.from("fm_adopter_answers").insert({ user_id: userId, answers });
}
