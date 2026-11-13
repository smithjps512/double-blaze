import { distanceMeters, fuzz, isValidLatLng, milesLabel, type LatLng } from "./geo";
import { SIZES, type Size, type Species } from "./types";

/**
 * Lost and found posts (Phase 2). Pure, so it is tested without a database.
 *
 * Private fields (the exact spot and the secret ID detail) never travel in a
 * `Report`: they live in `ReportPrivate`, which only the poster and shelter
 * staff can read (RLS on fm_report_private).
 */

export type ReportKind = "lost" | "found";
export type ReportStatus = "open" | "reunited" | "closed";
export type Chip = "yes" | "no" | "unknown";

export interface Report {
  id: string;
  kind: ReportKind;
  userId: string;
  species: Species;
  /** Lost posts: the pet's name. Found posts: usually empty. */
  name: string;
  sex: "male" | "female" | "unknown";
  size: Size;
  colors: string;
  description: string;
  photoUrl: string | null;
  seenOn: string;
  areaText: string;
  /** The fuzzed public point. */
  publicPoint: LatLng;
  microchipped: Chip;
  status: ReportStatus;
  createdAt: string;
}

export interface ReportPrivate {
  reportId: string;
  exact: LatLng;
  secretDetail: string;
}

export interface ReportInput {
  kind: ReportKind;
  species: Species;
  name: string;
  sex: Report["sex"];
  size: Size;
  colors: string;
  description: string;
  seenOn: string;
  areaText: string;
  exact: LatLng;
  microchipped: Chip;
  secretDetail: string;
}

function str(form: FormData, k: string, max: number): string {
  return String(form.get(k) ?? "").trim().slice(0, max);
}

/** Reads the post form. `today` bounds the date so nobody posts from the future. */
export function parseReportForm(form: FormData, today: string): { value?: ReportInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const kind = str(form, "kind", 5);
  if (kind !== "lost" && kind !== "found") errors.kind = "Choose lost or found.";
  const species = str(form, "species", 3);
  if (species !== "dog" && species !== "cat") errors.species = "Choose dog or cat.";
  const sexRaw = str(form, "sex", 7);
  const sex = sexRaw === "male" || sexRaw === "female" ? sexRaw : "unknown";
  const sizeRaw = str(form, "size", 6);
  const size = ((SIZES as string[]).includes(sizeRaw) ? sizeRaw : species === "cat" ? "small" : "") as Size | "";
  if (!size) errors.size = "Choose a size.";
  const name = str(form, "name", 60);
  if (kind === "lost" && !name) errors.name = "Add your pet's name.";
  const colors = str(form, "colors", 80);
  if (!colors) errors.colors = "Add their colors, like \"black with a white chest\".";
  const seenOn = str(form, "seenOn", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(seenOn) || seenOn > today) errors.seenOn = "Pick the date, today or earlier.";
  const areaText = str(form, "areaText", 120);
  if (!areaText) errors.areaText = "Describe the area, like \"near Main St park\".";
  const exact = { lat: Number(form.get("lat")), lng: Number(form.get("lng")) };
  if (!isValidLatLng(exact) || (exact.lat === 0 && exact.lng === 0)) errors.location = "Tap the map where they were last seen.";
  const secretDetail = str(form, "secretDetail", 200);
  if (secretDetail.length < 3) errors.secretDetail = "Add one detail that is not in the photo or description.";
  const chipRaw = str(form, "microchipped", 7);
  const microchipped: Chip = chipRaw === "yes" || chipRaw === "no" ? chipRaw : "unknown";

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    value: {
      kind: kind as ReportKind,
      species: species as Species,
      name,
      sex,
      size: size as Size,
      colors,
      description: str(form, "description", 1000),
      seenOn,
      areaText,
      exact,
      microchipped,
      secretDetail,
    },
  };
}

export function publicPointFor(input: Pick<ReportInput, "exact">): LatLng {
  return fuzz(input.exact);
}

// ---------------------------------------------------------------- matching

export interface ReportMatch {
  report: Report;
  score: number;
  reasons: string[];
}

const STOP = new Set(["and", "with", "the", "a", "an", "of", "on", "in", "has", "his", "her", "very", "some", "little", "dog", "cat"]);

export function words(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/s$/, "")),
  );
}

/** Max distance for a suggestion. Pets travel; 8 km covers most cases. */
export const MATCH_RADIUS_METERS = 8000;
/** Found reports more than this many days before the loss cannot be the same pet. */
const DAYS_BEFORE = 1;
/** Or more than this long after. */
const DAYS_AFTER = 45;

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * How likely a lost and a found post are the same animal, 0 to 100, from
 * public fields only (so suggestions never leak the private spot). Returns
 * null when they cannot be the same: different species, too far, wrong dates.
 */
export function compareReports(lost: Report, found: Report): ReportMatch | null {
  if (lost.kind !== "lost" || found.kind !== "found") return null;
  if (lost.species !== found.species) return null;
  if (lost.status !== "open" || found.status !== "open") return null;
  const gap = daysBetween(lost.seenOn, found.seenOn);
  if (gap < -DAYS_BEFORE || gap > DAYS_AFTER) return null;
  const meters = distanceMeters(lost.publicPoint, found.publicPoint);
  if (meters > MATCH_RADIUS_METERS) return null;

  const reasons: string[] = [];
  // Distance: full marks within 1 km, falling to zero at the radius.
  const near = meters <= 1000 ? 1 : 1 - (meters - 1000) / (MATCH_RADIUS_METERS - 1000);
  reasons.push(`Seen ${milesLabel(meters)} apart`);
  const timing = gap <= 3 ? 1 : gap <= 14 ? 0.6 : 0.3;
  if (gap >= 0 && gap <= 3) reasons.push(gap === 0 ? "Same day" : `Found ${gap} ${gap === 1 ? "day" : "days"} after lost`);

  const sizeGap = Math.abs(SIZES.indexOf(lost.size) - SIZES.indexOf(found.size));
  const size = lost.species === "cat" ? 1 : sizeGap === 0 ? 1 : sizeGap === 1 ? 0.4 : 0;
  if (lost.species === "dog" && sizeGap === 0) reasons.push("Same size");

  const a = words(lost.colors);
  const b = words(found.colors);
  const shared = [...a].filter((w) => b.has(w));
  const color = a.size && b.size ? shared.length / Math.min(a.size, b.size) : 0.5;
  if (shared.length) reasons.push(`Both ${shared.join(", ")}`);

  const sex = lost.sex === "unknown" || found.sex === "unknown" ? 0.6 : lost.sex === found.sex ? 1 : 0;
  if (sex === 0) return null;

  const score = Math.round(100 * (0.35 * near + 0.15 * timing + 0.15 * size + 0.3 * Math.min(1, color) + 0.05 * sex));
  return { report: found, score, reasons };
}

/** Suggestions for one post from the other side, best first. */
export function suggestMatches(target: Report, others: Report[], limit = 5, minScore = 40): ReportMatch[] {
  const out: ReportMatch[] = [];
  for (const o of others) {
    if (o.id === target.id || o.kind === target.kind) continue;
    const m = target.kind === "lost" ? compareReports(target, o) : compareReports(o, target);
    if (m && m.score >= minScore) out.push({ ...m, report: o });
  }
  return out.sort((x, y) => y.score - x.score).slice(0, limit);
}

// ------------------------------------------------------------ secret detail

/**
 * Compares a helper's description with the poster's secret detail. The
 * poster always decides; this only highlights shared words so a scammer who
 * guesses vaguely ("brown dog") stands out from someone who names the scar.
 */
export function detailOverlap(secret: string, answer: string): { shared: string[]; strength: "strong" | "some" | "none" } {
  const s = words(secret);
  const shared = [...words(answer)].filter((w) => s.has(w));
  const strength = shared.length === 0 ? "none" : shared.length >= 2 || shared.length >= s.size ? "strong" : "some";
  return { shared, strength };
}
