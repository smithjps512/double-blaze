"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so it loads in the browser only. */
export const Map = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-3xl bg-cream-dim" aria-label="Loading map" />,
});
export type { MapPoint } from "./LeafletMap";
