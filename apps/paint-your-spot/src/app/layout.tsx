import type { Metadata, Viewport } from "next";
import { Big_Shoulders_Stencil, Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteUrl } from "@/lib/data";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const stencil = Big_Shoulders_Stencil({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-stencil",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Paint Your Spot | Blacksburg Middle School", template: "%s | Paint Your Spot" },
  description:
    "BMS staff: buy the rights to paint your parking spot. Money raised goes to staff events, meals, and celebrations.",
  openGraph: {
    title: "Paint Your Spot at BMS",
    description: "Prime parking real estate, now accepting interest. Staff only.",
    images: [{ url: "/examples/example-spot-lot.jpg", width: 1084, height: 813 }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0659A8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${stencil.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-tape focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
