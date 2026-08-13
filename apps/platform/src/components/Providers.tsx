import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { isClerkEnabled } from "@/lib/auth";
import { RegionProvider } from "./RegionProvider";
import type { RegionLite } from "@/lib/regions";

/**
 * App-wide providers. RegionProvider supplies the "current region" context
 * (always on, no secrets). ClerkProvider wraps it only when Clerk is
 * configured, so the public storefront has no auth dependency.
 */
export function Providers({
  children,
  regions,
  initialRegionSlug,
}: {
  children: ReactNode;
  regions: RegionLite[];
  initialRegionSlug: string;
}) {
  const withRegion = (
    <RegionProvider regions={regions} initialSlug={initialRegionSlug}>
      {children}
    </RegionProvider>
  );

  if (!isClerkEnabled) {
    return withRegion;
  }
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#CF4420" },
      }}
    >
      {withRegion}
    </ClerkProvider>
  );
}
