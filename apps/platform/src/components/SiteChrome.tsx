"use client";

import { usePathname } from "next/navigation";
import { isBareRoute } from "@/lib/site";

/**
 * The company's header and footer, and the rule for when they are not shown.
 *
 * They are passed in already rendered rather than imported here, so they stay
 * server components and this stays the only client-side thing in the layout.
 * All this does is read the path and decide.
 */
export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const bare = isBareRoute(usePathname());

  return (
    <>
      {!bare && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-stone-white"
        >
          Skip to content
        </a>
      )}
      {!bare && header}
      <main id="main" className="flex-1">
        {children}
      </main>
      {!bare && footer}
    </>
  );
}
