import { NextResponse, type NextRequest } from "next/server";
import { askStoryteller, MAX_QUESTION_LENGTH, type StoryTurn } from "@/lib/yamal-storyteller";

/**
 * POST /api/yamal/ask
 *
 * The "Ask about Yamal" box calls this. Anonymous, like the Trail Crew helper:
 * no account, no name, nothing that identifies a child. The answer is
 * generated from the tracker's own data file and nothing else.
 */
export const maxDuration = 60;

/**
 * The same small in-memory throttle the Trail Crew helper uses, keyed on the
 * page rather than the person because there is no person to key on. It stops
 * one student holding the button down; it is not a defence against anything
 * more determined, and does not need to be for one classroom.
 */
const recent: number[] = [];
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function throttled(): boolean {
  const now = Date.now();
  while (recent.length && now - recent[0] >= WINDOW_MS) recent.shift();
  recent.push(now);
  return recent.length > MAX_PER_WINDOW;
}

function isTurn(value: unknown): value is StoryTurn {
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

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const history = Array.isArray(body.history) ? body.history.filter(isTurn) : [];

  if (!question) {
    return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `That is a long one. Keep it under ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (throttled()) {
    return NextResponse.json(
      { error: "That is a lot of questions very fast. Give it a minute and try again." },
      { status: 429 },
    );
  }

  const reply = await askStoryteller({ question, history });
  if (!reply.ok) {
    const message =
      reply.reason === "not_configured"
        ? "The storyteller is not switched on yet. Ask your teacher."
        : "Something went wrong on my end. Try again in a moment, and ask your teacher if it keeps happening.";
    return NextResponse.json({ error: message }, { status: 200 });
  }
  return NextResponse.json({ answer: reply.answer });
}
