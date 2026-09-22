import { NextResponse, type NextRequest } from "next/server";
import { getTeamProgress, writeProgress, type CardState } from "@/lib/trail-crew-progress";
import { getTeamTesting } from "@/lib/trail-crew-testing";
import { shapeTesting, type CardTestingView } from "@/lib/trail-crew-testing-shape";

/**
 * GET  /api/trail-crew/progress?team=slug   the team's cards and what is ticked
 * POST /api/trail-crew/progress             tick a line, or set a card's status
 *
 * Anonymous, like the rest of Trail Crew: the team slug is the whole identity.
 * Every write is checked against the team's committed cards, so the only thing
 * a bored student can do here is tick and untick their own team's boxes, which
 * their teammates will notice and the teacher can reset.
 */
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

function throttled(slug: string): boolean {
  const now = Date.now();
  const hits = (recent.get(slug) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(slug, hits);
  return hits.length > MAX_PER_WINDOW;
}

/**
 * The board's state, with what testing found laid on each card. A card that
 * failed its last test or has an open bug carries that here, so the board can
 * say so next to the ticks; the ticks themselves are untouched.
 */
async function shape(progress: NonNullable<Awaited<ReturnType<typeof getTeamProgress>>>) {
  const testing = await getTeamTesting(progress.slug);
  const byCard = new Map<string, CardTestingView>();
  if (testing) for (const c of shapeTesting(testing).cards) byCard.set(c.slug, c);
  return {
    slug: progress.slug,
    doneCards: progress.doneCards,
    totalCards: progress.totalCards,
    doneCriteria: progress.doneCriteria,
    totalCriteria: progress.totalCriteria,
    cards: progress.cards.map((c) => ({
      slug: c.card.slug,
      number: c.card.number,
      title: c.card.title,
      story: c.card.story ?? null,
      buildIt: c.card.buildIt ?? null,
      criteria: c.card.criteria,
      done: c.done,
      state: c.state,
      testing: byCard.get(c.card.slug) ?? null,
    })),
  };
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("team") ?? "";
  const progress = slug ? await getTeamProgress(slug) : null;
  if (!progress) return NextResponse.json({ error: "No such team." }, { status: 404 });
  return NextResponse.json(await shape(progress), { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = typeof body.team === "string" ? body.team : "";
  const cardSlug = typeof body.card === "string" ? body.card : "";
  if (!slug || !cardSlug) return NextResponse.json({ error: "Missing team or card." }, { status: 400 });
  if (throttled(slug)) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }

  let result: { ok: boolean; error?: string };
  if (typeof body.criterion === "string") {
    result = await writeProgress(slug, {
      kind: "criterion",
      cardSlug,
      criterion: body.criterion,
      done: body.done === true,
    });
  } else if (body.state === "not_started" || body.state === "building" || body.state === "done") {
    result = await writeProgress(slug, { kind: "card", cardSlug, state: body.state as CardState });
  } else {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  if (!result.ok) return NextResponse.json({ error: result.error ?? "Could not save." }, { status: 400 });
  const progress = await getTeamProgress(slug);
  return NextResponse.json(progress ? await shape(progress) : { ok: true });
}
