import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Trail Crew is student class work. Reachable by link so a team can
      // share it, but not something to index or surface in a search result.
      disallow: ["/portal", "/execution", "/api", "/checkout", "/trail-crew", "/prototypes"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
