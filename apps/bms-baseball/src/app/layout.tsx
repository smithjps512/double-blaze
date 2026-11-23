import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "BMS Baseball Tryouts | Sign Up", template: "%s | BMS Baseball" },
  description:
    "Blacksburg Middle School baseball, grades 6 to 8. Sign up for tryouts. Never played before? You are welcome here!",
  openGraph: {
    title: "BMS Baseball: sign up for tryouts ⚾",
    description: "Grades 6 to 8. New players welcome. Takes about 2 minutes.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0659A8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
