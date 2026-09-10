import { NextResponse, type NextRequest } from "next/server";
import { savePhoto } from "@/lib/plant-id";

/**
 * POST /api/greenhouse/photo
 *
 * The teacher attaches a photo to one of the unnamed plants. Gated on the same
 * classroom code as settling. Students never reach this.
 */
export const maxDuration = 60;

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
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const specimenId = String(form.get("specimenId") ?? "");
  const code = String(form.get("code") ?? "");
  const file = form.get("file");

  if (!specimenId) return NextResponse.json({ error: "Which plant?" }, { status: 400 });
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pick a photo first." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That photo is over 8 MB. Export it a bit smaller." },
      { status: 200 },
    );
  }
  const extension = TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "That file is not an image we can use. JPG, PNG or WebP." },
      { status: 200 },
    );
  }

  const result = await savePhoto(
    specimenId,
    await file.arrayBuffer(),
    file.type,
    extension,
    code,
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 200 });
  return NextResponse.json({ ok: true });
}
