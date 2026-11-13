/**
 * Location privacy for lost and found posts.
 *
 * The exact spot is stored privately. The public sees the center of a
 * roughly 400 m grid cell, drawn as a circle big enough to contain the whole
 * cell. Snapping to a grid (instead of adding random noise) matters: random
 * noise can be averaged away by reloading the page, a fixed cell cannot.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Cell edge in meters. */
export const CELL_METERS = 400;
/** Public circle radius: covers the cell's corners (half the diagonal is about 283 m). */
export const PUBLIC_RADIUS_METERS = 400;

const METERS_PER_DEG_LAT = 111_320;

export function isValidLatLng(p: Partial<LatLng> | null | undefined): p is LatLng {
  return (
    !!p &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 85 &&
    Math.abs(p.lng) <= 180
  );
}

/** The public point for an exact one: the center of its grid cell. */
export function fuzz(exact: LatLng): LatLng {
  const latStep = CELL_METERS / METERS_PER_DEG_LAT;
  const latCell = Math.floor(exact.lat / latStep);
  const lat = (latCell + 0.5) * latStep;
  // Longitude cells use the cell's own latitude so every point in a cell
  // shares one step size (and so one center).
  const lngStep = CELL_METERS / (METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  const lng = (Math.floor(exact.lng / lngStep) + 0.5) * lngStep;
  return { lat: round(lat), lng: round(lng) };
}

function round(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

/** Great-circle distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function milesLabel(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.25) return "under a quarter mile";
  if (miles < 1) return "under a mile";
  return `about ${Math.round(miles)} ${Math.round(miles) === 1 ? "mile" : "miles"}`;
}
