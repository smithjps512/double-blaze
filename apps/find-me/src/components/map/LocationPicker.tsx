"use client";

import { useState } from "react";
import type { LatLng } from "@/lib/geo";
import { Map } from "./Map";

/**
 * Tap the map (or use the phone's location) to set the last-seen spot. The
 * exact point goes to the server in hidden fields; the public only ever sees
 * the fuzzed area.
 */
export function LocationPicker({ center, error }: { center: LatLng; error?: string }) {
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const useMine = () => {
    if (!navigator.geolocation) return setGeoError("Your browser cannot share location. Tap the map instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setGeoError("");
      },
      () => {
        setLocating(false);
        setGeoError("Could not get your location. Tap the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="lat" value={picked?.lat ?? ""} />
      <input type="hidden" name="lng" value={picked?.lng ?? ""} />
      <Map center={center} zoom={13} picked={picked} onPick={setPicked} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={useMine} disabled={locating}>
          {locating ? "Finding you..." : "Use where I am now"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {picked ? "Spot set. Tap again to move it." : "Tap the map where they were last seen."}
        </span>
      </div>
      {(error || geoError) && (
        <p className="text-sm font-semibold text-ember-dark" role="alert">
          {geoError || error}
        </p>
      )}
      <p className="text-xs text-muted">
        Only you and partner shelters see this exact spot. Everyone else sees an area about a quarter mile wide.
      </p>
    </div>
  );
}
