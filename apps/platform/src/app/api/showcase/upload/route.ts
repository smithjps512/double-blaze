import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { isSignedIn } from "@/lib/showcase-auth";
import { writeMedia } from "@/lib/showcase-db";

/**
 * POST /api/showcase/upload
 *
 * A car photo. Stored under a name derived from the bytes, so uploading the
 * same picture twice writes the same file and every stored path can be cached
 * forever without a stale image ever being served.
 */
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const team = String(form.get("team") ?? "");
  if (!team) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!(await isSignedIn(team))) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pick a picture first." }, { status: 400 });
  }

  const extension = TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "That is not a picture I can use. Try a JPG, PNG or WEBP." },
      { status: 200 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That picture is too big. Under 8MB, please." },
      { status: 200 },
    );
  }

  const bytes = await file.arrayBuffer();
  const digest = createHash("sha256").update(Buffer.from(bytes)).digest("hex").slice(0, 32);
  const path = `${team}/${digest}.${extension}`;

  const error = await writeMedia(path, bytes, file.type);
  if (error) return NextResponse.json({ error }, { status: 200 });

  return NextResponse.json({ ok: true, path });
}
