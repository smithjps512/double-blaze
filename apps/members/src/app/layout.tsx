import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Source_Serif_4 } from "next/font/google";
import { resolveTenant } from "@/lib/tenant";
import { pageTitle, resolveTheme, themeCss } from "@/lib/theme";
import "./globals.css";

/**
 * The root layout, and the one place a club's identity is applied.
 *
 * Two things happen here that used to happen nowhere:
 *
 *  1. **The club's design tokens become CSS custom properties.** They live on
 *     `sites.theme` (migration 0025) rather than in the stylesheet, because
 *     this application is multi-tenant and a stylesheet holding one club's navy
 *     would hand it to the next club. lib/theme.ts validates them before they
 *     reach the style tag below, and has a test that says why.
 *
 *  2. **The tab says what page you are on.** Every tab said "Members" until
 *     this session, which is what a title says when nobody has thought about
 *     it. Pages set their own; this is the fallback.
 *
 * ---------------------------------------------------------------------------
 * The fonts
 * ---------------------------------------------------------------------------
 *
 * Self-hosted through next/font, which downloads them at build time and serves
 * them from our own origin. Nothing is fetched from a third party when a member
 * loads a page, which matters for a club whose premise is that its inside is
 * not public: a webfont request to another company is a request that carries a
 * referrer.
 *
 * The families are passed to themeCss so the generated face sits in front of
 * the stack stored on the row, which then acts as the fallback rather than as
 * the only instruction. A club with a different stack in its theme still gets
 * its own type; it just does not get it self-hosted until somebody adds it
 * here.
 *
 * The marketing page still runs on Georgia and system-ui, because the static
 * renderer emits no external stylesheet link by deliberate design and there is
 * a test asserting it. Worth closing so the two halves match, and a separate
 * change from this one.
 */
const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  return {
    title: pageTitle(null, tenant?.name ?? "Members"),
    // A member area has nothing for a crawler and every reason not to be
    // indexed: the whole point of a vetted club is that its inside is not
    // public.
    robots: { index: false, follow: false },
    icons: {
      // An inline mark rather than a file, tinted with the club's own accent.
      // A favicon on disk would be one club's, and this application serves
      // every club on the platform from the same deployment.
      icon: [
        {
          url:
            "data:image/svg+xml," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
                '<rect width="32" height="32" rx="7" fill="#0d2b45"/>' +
                '<rect x="9" y="9" width="14" height="14" rx="3" fill="#2f9e6f"/>' +
                "</svg>",
            ),
        },
      ],
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const tenant = await resolveTenant();
  const theme = resolveTheme(tenant?.theme);

  return (
    <html lang="en">
      <head>
        {/* Emitted rather than imported, because the values differ per club and
            are only known once the hostname has been resolved. Validated in
            lib/theme.ts: nothing reaches this that is not a hex colour or a
            font stack. */}
        <style
          dangerouslySetInnerHTML={{
            __html: themeCss(theme, {
              body: sans.style.fontFamily,
              heading: serif.style.fontFamily,
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
