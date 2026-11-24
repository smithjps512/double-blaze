import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteChrome } from "@/components/SiteChrome";
import { BRAND } from "@/lib/brand";
import { SITE_URL, organizationJsonLd } from "@/lib/site";
import {
  allRegions,
  homeRegion,
  toRegionLite,
  REGION_COOKIE,
} from "@/lib/regions";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Program management across technology, people, data, experiences, facilities, and events | Double Blaze Solutions",
    template: `%s | ${BRAND.shortName}`,
  },
  description:
    "Veteran-owned program management for businesses, government agencies, and government contractors. You pay for program management. The software, designs, and content we build are included and yours.",
  keywords: [
    "program management",
    "government program management",
    "process automation",
    "themed destination design",
    "event management",
    "facility management",
    "veteran-owned",
  ],
  openGraph: {
    title: "Best-in-class program management. Everything we build is yours.",
    description:
      "Seven practice areas, one discipline. Clients pay for program management, and the software, designs, and content we build are included.",
    url: SITE_URL,
    siteName: BRAND.name,
    locale: "en_US",
    type: "website",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: BRAND.colors.blazeMaroon,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seed the region context from the cookie so the first paint already shows the
  // visitor's region (no flash). Falls back to the home region.
  const regions = allRegions();
  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(REGION_COOKIE)?.value;
  const initialRegionSlug =
    regions.find((r) => r.slug === cookieSlug)?.slug ?? homeRegion().slug;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers
          regions={regions.map(toRegionLite)}
          initialRegionSlug={initialRegionSlug}
        >
          <SiteChrome header={<Header />} footer={<Footer />}>
            {children}
          </SiteChrome>
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
      </body>
    </html>
  );
}
