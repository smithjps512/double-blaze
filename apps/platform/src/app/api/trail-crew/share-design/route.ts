import { NextResponse, type NextRequest } from "next/server";
import { teamExists, teamLabel } from "@/lib/trail-crew-edits";
import {
  isAnvilAppUrl,
  isFigmaDesignUrl,
  MAX_NOTE_LENGTH,
  submitDesignLink,
} from "@/lib/trail-crew-design-links";
import { sendTrailCrewDesignShared } from "@/lib/email";

/**
 * POST /api/trail-crew/share-design
 *
 * A team hands over their design: the Figma link, their published Anvil app
 * if there is one, and a line about where they are. Anonymous and team-scoped
 * like every other Trail Crew box. It stores the links and tells the teacher.
 * It cannot change a page.
 */
export const maxDuration = 30;

const recent = new Map<string, number[]>();
const WINDOW_MS = 600_000;
const MAX_PER_WINDOW = 4;

function throttled(slug: string): boolean {
  const now = Date.now();
  const hits = (recent.get(slug) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(slug, hits);
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = typeof body.team === "string" ? body.team : "";
  const figma = typeof body.figma === "string" ? body.figma.trim() : "";
  const anvil = typeof body.anvil === "string" ? body.anvil.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!slug || !teamExists(slug)) {
    return NextResponse.json({ error: "I do not know this team." }, { status: 400 });
  }
  if (!figma && !anvil) {
    return NextResponse.json({ error: "Paste your Figma link, your Anvil link, or both." }, { status: 400 });
  }
  if (figma && !isFigmaDesignUrl(figma)) {
    return NextResponse.json(
      { error: "That does not look like a Figma design link. In Figma, press Share, then Copy link. It starts with https://www.figma.com/design/" },
      { status: 400 },
    );
  }
  if (anvil && !isAnvilAppUrl(anvil)) {
    return NextResponse.json(
      { error: "That does not look like a published Anvil app. In Anvil, press Publish and copy the link that ends in .anvil.app" },
      { status: 400 },
    );
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "Keep the note to a line or two." }, { status: 400 });
  }
  if (throttled(slug)) {
    return NextResponse.json({ error: "You have shared this a few times already. Give it a few minutes." }, { status: 429 });
  }

  const stored = await submitDesignLink({ slug, figmaUrl: figma || null, anvilUrl: anvil || null, note });
  if (!stored.ok) {
    return NextResponse.json({ error: "I could not save that. Tell your teacher rather than trying again." }, { status: 200 });
  }

  const email = await sendTrailCrewDesignShared({
    teamLabel: teamLabel(slug),
    slug,
    figmaUrl: figma || null,
    anvilUrl: anvil || null,
    note,
  });
  if (!email.ok) console.error(`[trail-crew] design link ${stored.id} stored but not emailed`);

  return NextResponse.json({
    ok: true,
    message: "Shared. Your teacher has the link, and your design review will appear in your pages once the file has been read.",
  });
}
