import type { Metadata } from "next";

/**
 * Sandwich Bot: Chef Byte follows class instructions exactly as written.
 *
 * Class only. Every page checks the Race Day class password itself (same
 * password, same teacher code, same sub day switch). This layout only keeps
 * search engines and link previews away. No em dashes in any copy here.
 */
export const metadata: Metadata = {
  title: { absolute: "Sandwich Bot" },
  description: "Class only.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: null,
  twitter: null,
  alternates: { canonical: null },
};

export default function SandwichBotLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FFF8E7]">{children}</div>;
}
