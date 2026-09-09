import { NextResponse, type NextRequest } from "next/server";
import { isSignedIn } from "@/lib/showcase-auth";
import {
  citedFieldsOf,
  claimsSomething,
  countSources,
  deleteRow,
  getCarById,
  insertRow,
  RESEARCH_FIELDS,
  slugify,
  updateRow,
  type Kind,
} from "@/lib/showcase-db";

/**
 * POST/PATCH/DELETE /api/showcase/rows
 *
 * One route for cars, parts and quiz questions rather than three near-identical
 * ones. They differ only in which columns they accept, and that difference is
 * the `fields` map below, which is easier to read in one place than spread
 * across three files that would drift.
 */
export const maxDuration = 30;

const KINDS: Kind[] = ["cars", "parts", "quiz"];

/** What the admin may set, per kind. Anything not listed here is ignored. */
type Shape = Record<string, "text" | "int" | "choices">;

const FIELDS: Record<Kind, Shape> = {
  cars: {
    name: "text",
    year: "int",
    top_speed: "int",
    horsepower: "int",
    special: "text",
    image_path: "text",
    image_credit: "text",
    image_source_url: "text",
    sort_order: "int",
    ...Object.fromEntries(RESEARCH_FIELDS.map((f) => [f.column, "text" as const])),
  },
  parts: {
    name: "text",
    what_it_does: "text",
    if_upgraded: "text",
    hp_gain: "int",
    sort_order: "int",
  },
  quiz: {
    question: "text",
    choices: "choices",
    answer_index: "int",
    sort_order: "int",
  },
};

const MAX_TEXT = 4000;

/**
 * Take only the columns this kind allows, in the type it expects.
 *
 * An empty numeric field means "not set" rather than zero: a car whose year
 * nobody has typed yet should show a dash, not the year 0.
 */
function clean(kind: Kind, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [column, type] of Object.entries(FIELDS[kind])) {
    if (!(column in body)) continue;
    const raw = body[column];
    if (type === "text") {
      out[column] = typeof raw === "string" ? raw.slice(0, MAX_TEXT) : "";
    } else if (type === "int") {
      const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
      out[column] = Number.isFinite(n) ? n : null;
    } else {
      const list = Array.isArray(raw) ? raw : [];
      out[column] = list
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.slice(0, 300))
        .filter((c) => c.trim().length > 0)
        .slice(0, 6);
    }
  }
  return out;
}

async function guard(req: NextRequest): Promise<{ team: string; kind: Kind; body: Record<string, unknown> } | NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const team = typeof body.team === "string" ? body.team : "";
  const kind = body.kind as Kind;
  if (!team || !KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!(await isSignedIn(team))) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  return { team, kind, body };
}

export async function POST(req: NextRequest) {
  const checked = await guard(req);
  if (checked instanceof NextResponse) return checked;
  const { team, kind, body } = checked;

  const values = clean(kind, body);

  // Cars and parts are addressed by slug in the URL, so a new row needs one.
  // The quiz has no page of its own, so it does not.
  if (kind !== "quiz") {
    const name = typeof values.name === "string" ? values.name.trim() : "";
    if (!name) return NextResponse.json({ error: "It needs a name." }, { status: 400 });
    values.slug = slugify(name);
  } else if (typeof values.question !== "string" || !values.question.trim()) {
    return NextResponse.json({ error: "It needs a question." }, { status: 400 });
  }

  const error = await insertRow(kind, team, values);
  // A duplicate slug is the one failure a student will actually hit, by adding
  // two cars with the same name, and friendlyError has the sentence for it.
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 200 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const checked = await guard(req);
  if (checked instanceof NextResponse) return checked;
  const { team, kind, body } = checked;

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const values = clean(kind, body);
  // An edited row is no longer the placeholder that was seeded, so the "replace
  // this" badge comes off the moment they change it. Nobody should have to
  // clear a flag by hand to stop being told to do something they just did.
  values.is_example = false;

  // The rule, and the reason it lives here rather than only in the form: a
  // form can be skipped by anybody who opens the developer tools, and a rule
  // about honesty that a clever student can walk around teaches the wrong
  // thing louder than it teaches the right one.
  if (kind === "cars") {
    const stored = await getCarById(team, id);
    if (claimsSomething(citedFieldsOf(stored), values) && (await countSources(team, id)) === 0) {
      return NextResponse.json(
        {
          error:
            "Add a source first. Everything you have written here is a claim about a real car, and a claim with nothing behind it is just something somebody said on the internet. Put in where you found it, then save.",
        },
        { status: 200 },
      );
    }
  }

  const error = await updateRow(kind, team, id, values);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 200 });
  return NextResponse.json({ ok: true });
}

/**
 * Turn a database refusal into a sentence a thirteen year old can act on.
 *
 * The photo credit rule is a check constraint, so breaking it comes back as a
 * constraint name. That is the correct place for the rule and the wrong thing
 * to show somebody.
 */
function friendlyError(error: string): string {
  if (/showcase_cars_photo_is_credited/.test(error)) {
    return "A photo needs to say who it belongs to and where it came from. Fill in both boxes under the picture, then save.";
  }
  if (/duplicate key|unique/i.test(error)) {
    return "There is already one with that name. Give it a different one.";
  }
  return error;
}

export async function DELETE(req: NextRequest) {
  const checked = await guard(req);
  if (checked instanceof NextResponse) return checked;
  const { team, kind, body } = checked;

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const error = await deleteRow(kind, team, id);
  return error
    ? NextResponse.json({ error }, { status: 200 })
    : NextResponse.json({ ok: true });
}
