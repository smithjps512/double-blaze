import { redirect } from "next/navigation";

/**
 * The dashboard (tip, export, correction, upgrade) now lives on the single
 * lifecycle status page. Keep this URL working by redirecting to it.
 */
export default async function TrailheadDashboardRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/trailhead/status/${token}`);
}
