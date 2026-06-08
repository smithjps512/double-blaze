import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/brand";
import { SITE_URL, localBusinessJsonLd } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Web, app & technology development across the New River and Roanoke valleys | Double Blaze Solutions",
    template: `%s — ${BRAND.shortName}`,
  },
  description:
    "Veteran-owned technology company serving the New River Valley, Roanoke Valley, and Martinsville/Danville. We build websites, apps, and digital solutions that help local businesses grow.",
  keywords: [
    "New River Valley web development",
    "Roanoke web development",
    "Blacksburg app development",
    "Christiansburg website design",
    "Virginia veteran-owned technology company",
  ],
  openGraph: {
    title: "Enterprise-grade technology, built right here at home.",
    description:
      "Double Blaze Solutions helps businesses across the New River Valley, Roanoke Valley, and Martinsville/Danville grow with websites, apps, and digital strategy, delivered by a team that has built for some of the biggest names in the world.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-stone-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd()),
          }}
        />
      </body>
    </html>
  );
}
