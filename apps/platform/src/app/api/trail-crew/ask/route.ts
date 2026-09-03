import { NextResponse, type NextRequest } from "next/server";
import {
  askHelper,
  logQuestion,
  MAX_QUESTION_LENGTH,
  type HelperMode,
  type HelperTurn,
} from "@/lib/trail-crew-helper";

/**
 * POST /api/trail-crew/ask
 *
 * The student build guides call this. It is deliberately anonymous: no account,
 * no name, nothing that identifies a child. The team slug is in the URL of the
 * page they are reading, and that is all the identity this feature has or wants.
 *
 * Every question is logged for the teacher, answered or not.
 */
export const maxDuration = 60;

/**
 * A small in-memory throttle. It resets on every cold start and does not span
 * instances, which is fine: the job is to stop one bored student holding the
 * button down, not to defend a bank. A real limiter would need shared state,
 * and that is not worth it for one classroom.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function throttled(slug: string): boolean {
  const now = Date.now();
  const hits = (recent.get(slug) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(slug, hits);
  return hits.length > MAX_PER_WINDOW;
}

function isTurn(value: unknown): value is HelperTurn {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = typeof body.team === "string" ? body.team : "";
  const question = typeof body.question === "string" ? body.question : "";
  const history = Array.isArray(body.history) ? body.history.filter(isTurn) : [];
  const mode: HelperMode = body.mode === "debug" ? "debug" : "learn";
  const errorText = typeof body.error === "string" ? body.error : "";
  const codeText = typeof body.code === "string" ? body.code : "";

  // In debug mode the red text alone is a legitimate question: a student who
  // pastes an error and types nothing has still told us everything we need.
  if (!slug || (!question.trim() && !(mode === "debug" && errorText.trim()))) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `That is a long one. Keep it under ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (throttled(slug)) {
    return NextResponse.json(
      { error: "That is a lot of questions very fast. Give it a minute and try again." },
      { status: 429 },
    );
  }

  const reply = await askHelper({ slug, question, history, mode, errorText, codeText });
  // Log the error text too when that is all they sent, so the teacher's view
  // shows what actually broke rather than an empty question.
  await logQuestion({
    slug,
    question: `[${mode}] ${question || errorText.split("\n")[0]}`,
    answered: reply.ok,
  });

  if (!reply.ok) {
    const message =
      reply.reason === "not_configured"
        ? "The helper is not switched on yet. Ask your teacher."
        : reply.reason === "unknown_team"
          ? "I do not have this team's build documents, so I cannot help here yet."
          : "Something went wrong on my end. Try again in a moment, and ask your teacher if it keeps happening.";
    return NextResponse.json({ error: message }, { status: 200 });
  }

  return NextResponse.json({ answer: reply.answer });
}
