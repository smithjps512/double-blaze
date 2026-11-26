import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Welcome to Joe's", template: "%s | Joe's" },
  description: "Check in at Joe's Diner. Breakfast all day.",
  applicationName: "Welcome to Joe's",
  icons: { icon: "/joes-logo.png", apple: "/joes-logo.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#C42242",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
