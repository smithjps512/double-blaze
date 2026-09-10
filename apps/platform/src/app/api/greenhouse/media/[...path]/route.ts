import { NextResponse } from "next/server";
import { readPhoto } from "@/lib/plant-id";

/**
 * GET /api/greenhouse/media/<path>
 *
 * Serves a plant photo out of the private bucket. Private and proxied rather
 * than a public bucket URL, the same choice the showcase makes, which keeps the
 * storage URLs out of the open and leaves the cache headers ours to set.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const objectPath = (path ?? []).join("/");
  if (!objectPath) return new NextResponse("Not found", { status: 404 });

  const media = await readPhoto(objectPath);
  if (!media) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(media.bytes, {
    headers: {
      "Content-Type": media.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
