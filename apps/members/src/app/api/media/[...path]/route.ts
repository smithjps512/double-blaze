import { NextResponse, type NextRequest } from "next/server";
import { getSessionClient } from "@/lib/auth";
import { resolveTenant } from "@/lib/tenant";

/**
 * GET /api/media/<site_id>/<member_id>/<file>
 *
 * Serves a member's upload. The bucket is private, so this route is the only
 * way bytes get out, and that is the point rather than an inconvenience: a
 * public bucket would make every member's photo enumerable by anyone holding
 * the publishable key, and this club's whole premise is that its inside is not
 * public.
 *
 * The download runs under the reader's own session, so
 * `member_media_member_read` from 0022 is what authorizes it. This route
 * deliberately does no membership check of its own beyond resolving the tenant:
 * if the policy would refuse, the download fails, and there is no second
 * opinion here that could disagree with it.
 *
 * The path is checked against the tenant anyway, so a member of one club cannot
 * use their session to pull another club's media through this hostname. The
 * policy would also refuse that; this makes it refuse sooner and more clearly.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const tenant = await resolveTenant();
  if (!tenant) return new NextResponse("Not found", { status: 404 });

  const { path } = await params;
  const objectPath = (path ?? []).join("/");

  // Three segments, the first of which must be this club. Anything else is not
  // a path this application ever wrote.
  if (path.length !== 3 || path[0] !== tenant.siteId || objectPath.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const db = await getSessionClient();
  if (!db) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await db.storage.from("member-media").download(objectPath);
  if (error || !data) return new NextResponse("Not found", { status: 404 });

  // Private, because the response depends on the reader's session. A shared
  // cache holding this would hand one member's photo to a signed-out visitor.
  // immutable is safe because every upload gets a fresh random filename, so a
  // changed photo is a changed URL.
  return new NextResponse(data.stream() as unknown as ReadableStream, {
    headers: {
      "content-type": data.type || "application/octet-stream",
      "cache-control": "private, max-age=31536000, immutable",
      // The bucket accepts PDFs and audio as well as images, and a browser
      // deciding for itself what to do with bytes a member uploaded is not a
      // decision worth leaving open.
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
