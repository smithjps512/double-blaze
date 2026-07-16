import { notFound } from "next/navigation";
import { getSiteBySubdomain } from "@/lib/trailhead-db";
import { renderPage } from "@/lib/trailhead-render";
import type { BuiltSite } from "@/lib/spark-trailhead";

/**
 * Trailhead subdomain rendering. Middleware rewrites sub.doubleblaze.solutions
 * to /trailhead-site/[subdomain]. This page does the DB lookup and 404s if
 * unknown. ISR revalidates every 60 seconds so published sites serve fast.
 */

export const revalidate = 60;

export default async function TrailheadSitePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  let site;
  try {
    site = await getSiteBySubdomain(subdomain);
  } catch {
    notFound();
  }

  if (!site) notFound();

  // Only serve published or preview sites
  if (site.status !== "published" && site.status !== "preview") {
    notFound();
  }

  const builtSite = site.built_content as BuiltSite | null;
  if (!builtSite?.pages?.length) {
    notFound();
  }

  // Render the home page (or the first page)
  const rendered = renderPage(builtSite, 0, subdomain);
  if (!rendered) notFound();

  return (
    <div
      dangerouslySetInnerHTML={{ __html: rendered.html }}
      suppressHydrationWarning
    />
  );
}
