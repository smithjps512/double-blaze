import { redirect } from "next/navigation";

/**
 * The review step now lives on the single lifecycle status page. Keep this URL
 * working for any link already in the wild by redirecting to it.
 */
export default async function TrailheadReviewRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/trailhead/status/${token}`);
}
