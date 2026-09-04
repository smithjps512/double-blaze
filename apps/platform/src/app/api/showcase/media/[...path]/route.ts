import { NextResponse } from "next/server";
import { readMedia } from "@/lib/showcase-db";

/**
 * GET /api/showcase/media/<path>
 *
 * The bucket is private and this route serves the bytes, which is the same
 * choice `site-assets` makes: it keeps the storage URLs out of the open and
 * leaves the cache headers ours to set. The stored name is a hash of the file,
 * so a path always means the same bytes and can be cached for a year.
 */
export const dynamic = "force-static";
export const revalidate = 31536000;

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const key = path.join("/");

  // Traversal has no meaning to the storage API, but a path that tries it is a
  // request nobody legitimate makes, so it does not get a round trip.
  if (!key || key.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await readMedia(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(file.bytes, {
    headers: {
      "content-type": file.type,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
