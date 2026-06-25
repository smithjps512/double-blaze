"use client";

import { useEffect } from "react";
import { useRegion } from "./RegionProvider";

/** Footer tagline, region-aware: "Enterprise technology. {region} roots." */
export function RegionTagline() {
  const { current } = useRegion();
  const root = current?.shortName ?? "New River Valley";
  return <>Enterprise technology. {root} roots.</>;
}

/** Home hero eyebrow: "Veteran-owned · Serving {region}". */
export function HeroEyebrow() {
  const { current } = useRegion();
  const where = current?.shortName ?? "New River Valley";
  return (
    <>
      Veteran-owned &middot; Serving {where}
    </>
  );
}

/** Home hero intro, with the location swapped to the current region. */
export function HeroIntro() {
  const { current } = useRegion();
  const where = current?.shortName ?? "the New River Valley";
  return (
    <>
      Double Blaze Solutions helps businesses across {where} grow with websites,
      apps, and digital strategy, delivered by a team that has built for some of
      the biggest names in the world.
    </>
  );
}

/**
 * Sets the current region from a region page so the footer and any later
 * homepage visit reflect it. Renders nothing. Used on /regions/[slug].
 */
export function RegionSync({ slug }: { slug: string }) {
  const { setRegion } = useRegion();
  useEffect(() => {
    setRegion(slug);
  }, [slug, setRegion]);
  return null;
}
