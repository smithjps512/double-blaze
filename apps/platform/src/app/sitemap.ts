import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getResolvedActiveRegions } from "@/lib/regions-db";

// DB-resolved active regions (static-seed fallback) so a newly activated region
// is indexed without a redeploy. coming_soon regions are intentionally omitted.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/services",
    "/solutions",
    "/pricing",
    "/about",
    "/start-a-project",
    "/regions",
  ];
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const regions = await getResolvedActiveRegions();
  const regionEntries: MetadataRoute.Sitemap = regions.map((r) => ({
    url: `${SITE_URL}/regions/${r.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...regionEntries];
}
