import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DemoBanner } from "@/components/DemoBanner";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { siteUrl } from "@/lib/data";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["600", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Find Me | Local shelter pets, matched to you", template: "%s | Find Me" },
  description:
    "Meet adoptable dogs and cats from local shelters, matched to your home and lifestyle. Adopt, then get a care plan built for your new pet.",
  applicationName: "Find Me",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Find Me", statusBarStyle: "default" },
  openGraph: { title: "Find Me", description: "Local shelter pets, matched to you.", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#D9481F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-sun focus:px-4 focus:py-2 focus:font-semibold"
        >
          Skip to content
        </a>
        <DemoBanner />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
