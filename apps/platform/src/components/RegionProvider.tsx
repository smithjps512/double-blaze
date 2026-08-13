"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { REGION_COOKIE, type RegionLite } from "@/lib/regions";

/**
 * Client-side "current region" context. The selected region personalizes the
 * footer tagline and the homepage location copy, and persists across pages via
 * the REGION_COOKIE so a returning visitor lands on their region's messaging.
 *
 * The server seeds `initialSlug` from the cookie (in the root layout) so the
 * first paint is already correct (no flash), and this context keeps it in sync
 * during client-side navigation, which does not re-render the shared layout.
 */
interface RegionContextValue {
  regions: RegionLite[];
  current: RegionLite | null;
  setRegion: (slug: string) => void;
}

const RegionContext = createContext<RegionContextValue | null>(null);

const ONE_EIGHTY_DAYS = 60 * 60 * 24 * 180;

export function RegionProvider({
  regions,
  initialSlug,
  children,
}: {
  regions: RegionLite[];
  initialSlug: string;
  children: ReactNode;
}) {
  const [slug, setSlug] = useState(initialSlug);

  const setRegion = useCallback(
    (next: string) => {
      if (!regions.some((r) => r.slug === next)) return;
      setSlug(next);
      document.cookie = `${REGION_COOKIE}=${next}; path=/; max-age=${ONE_EIGHTY_DAYS}; samesite=lax`;
    },
    [regions],
  );

  const value = useMemo<RegionContextValue>(() => {
    const current =
      regions.find((r) => r.slug === slug) ?? regions[0] ?? null;
    return { regions, current, setRegion };
  }, [regions, slug, setRegion]);

  return (
    <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
  );
}

/**
 * Reads the current region. Returns null-safe defaults when no provider is
 * mounted (e.g. an isolated test render), so consumers never crash.
 */
export function useRegion(): RegionContextValue {
  return (
    useContext(RegionContext) ?? {
      regions: [],
      current: null,
      setRegion: () => {},
    }
  );
}
