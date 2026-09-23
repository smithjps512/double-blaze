import { NextResponse, type NextRequest } from "next/server";
import { checkAnswer, findCity } from "@/lib/smart-cities";
import { approvedAnswers, screenAnswer, submitAnswer } from "@/lib/smart-cities-db";
import { throttled } from "@/lib/plant-id-throttle";
import { sendSmartCityAnswer } from "@/lib/email";

/**
 * GET  /api/smart-cities/answers?city=slug   approved answers for a city
 * POST /api/smart-cities/answers             { city, question, answer, writer }
 *
 * Anonymous. A posted answer waits for the teacher and only appears on the
 * city page once approved.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const city = findCity(req.nextUrl.searchParams.get("city"));
  if (!city) return NextResponse.json({ error: "No such city." }, { status: 404 });
  const answers = await approvedAnswers(city.slug);
  return NextResponse.json(
    { answers: answers.map((a) => ({ question: a.questionIndex, answer: a.answer, writer: a.writer })) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const checked = checkAnswer(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  if (throttled(`answer:${checked.city.slug}`)) {
    return NextResponse.json({ error: "Lots of answers at once! Try again in a few seconds." }, { status: 429 });
  }

  const question = checked.city.questions[checked.questionIndex];
  const screen = await screenAnswer(question, checked.answer);
  const saved = await submitAnswer({
    citySlug: checked.city.slug,
    questionIndex: checked.questionIndex,
    answer: checked.answer,
    writer: checked.writer,
    ...screen,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 503 });

  // Best effort: the answer is saved whether or not the email goes.
  await sendSmartCityAnswer({
    cityName: checked.city.name,
    question,
    answer: checked.answer,
    writer: checked.writer,
    flagged: screen.flagged,
    flagReason: screen.flagReason,
  });

  return NextResponse.json({ ok: true });
}
