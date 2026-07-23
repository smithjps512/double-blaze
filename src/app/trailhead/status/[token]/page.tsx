import { notFound } from "next/navigation";
import { isValidStatusToken } from "@/lib/trailhead";
import { getPublicSiteStatusByToken } from "@/lib/trailhead-db";
import { TrailheadStatusView } from "@/components/TrailheadStatusView";

/**
 * The single durable status URL for a Trailhead site: /trailhead/status/[token].
 * One token, one page, for the whole lifecycle. It renders the right stage from
 * the current status and reads only client-safe fields (no feasibility or
 * boundary flags, no staff notes, no notification log, no internal routing).
 *
 * Not indexed and always dynamic: the token is a capability, so we never cache
 * or expose it to crawlers.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Trailhead status",
  robots: { index: false, follow: false },
};

export default async function TrailheadStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate the token shape before any DB work so a malformed or probing
  // token never reaches a query.
  if (!isValidStatusToken(token)) {
    notFound();
  }

  let data;
  try {
    data = await getPublicSiteStatusByToken(token);
  } catch {
    notFound();
  }

  if (!data) {
    notFound();
  }

  return <TrailheadStatusView token={token} data={data} />;
}
