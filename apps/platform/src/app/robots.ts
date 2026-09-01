import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Trail Crew and the Greenhouse are student class work. Reachable by
      // link so a class can share it, but not something to index or surface in
      // a search result.
      disallow: [
        "/portal",
        "/execution",
        "/api",
        "/checkout",
        "/trail-crew",
        "/prototypes",
        "/greenhouse",
        "/plant-showcase",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
