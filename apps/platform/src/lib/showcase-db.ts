import "server-only";
import { getSupabaseAnonClient, getSupabaseServiceClient } from "./supabase";
import { CITED_COLUMNS, RESEARCH_FIELDS, claimsSomething, slugify } from "./showcase-fields";

// The vocabulary and the rule live in `showcase-fields`, which is not
// server-only, because the editor is a client component and importing this
// module from the browser would fail at build time. Re-exported so the rest of
// the app has one place to import from.
export { RESEARCH_FIELDS, CITED_COLUMNS, claimsSomething, slugify };
export type { ResearchKey } from "./showcase-fields";

/**
 * The showcase: reads and writes for a student team's site and its admin.
 *
 * Reads go through the anon key, because the content is public and RLS says so.
 * Writes go through the service role, because the admin is gated by a shared
 * passcode checked on the server rather than by a database identity, so there
 * is no role RLS could grant a write to. See `0029_showcase.sql`.
 */

export interface Car {
  id: string;
  slug: string;
  name: string;
  year: number | null;
  topSpeed: number | null;
  horsepower: number | null;
  special: string;
  imagePath: string | null;
  isExample: boolean;
  sortOrder: number;

  // --- Researched, and each one a question somebody has to go and answer ---
  manufacturer: string;
  production: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  chassis: string;
  suspension: string;
  brakes: string;
  carHistory: string;
  makerHistory: string;

  /** Who the photograph belongs to, and the page it came from. */
  imageCredit: string;
  imageSourceUrl: string;
}

/** A citation: what it was, where it is, and which part of the page it backs. */
export interface Source {
  id: string;
  carId: string;
  title: string;
  url: string;
  covers: string;
}

export interface Part {
  id: string;
  slug: string;
  name: string;
  whatItDoes: string;
  ifUpgraded: string;
  /** Null: not something you bolt on, so it stays out of the builder. */
  hpGain: number | null;
  isExample: boolean;
  sortOrder: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  isExample: boolean;
  sortOrder: number;
}

/**
 * Where the builder starts.
 *
 * Their architecture says "start with a number, say 300", so this is their
 * number rather than one chosen here. It lives in one place because the same
 * figure has to appear on the builder and in the copy explaining it.
 */
export const STOCK_HORSEPOWER = 300;

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

function toCar(r: Row): Car {
  return {
    id: str(r.id),
    slug: str(r.slug),
    name: str(r.name),
    year: num(r.year),
    topSpeed: num(r.top_speed),
    horsepower: num(r.horsepower),
    special: str(r.special),
    imagePath: typeof r.image_path === "string" && r.image_path ? r.image_path : null,
    isExample: r.is_example === true,
    sortOrder: num(r.sort_order) ?? 0,
    manufacturer: str(r.manufacturer),
    production: str(r.production),
    engine: str(r.engine),
    transmission: str(r.transmission),
    drivetrain: str(r.drivetrain),
    chassis: str(r.chassis),
    suspension: str(r.suspension),
    brakes: str(r.brakes),
    carHistory: str(r.car_history),
    makerHistory: str(r.maker_history),
    imageCredit: str(r.image_credit),
    imageSourceUrl: str(r.image_source_url),
  };
}

function toSource(r: Row): Source {
  return {
    id: str(r.id),
    carId: str(r.car_id),
    title: str(r.title),
    url: str(r.url),
    covers: str(r.covers),
  };
}

function toPart(r: Row): Part {
  return {
    id: str(r.id),
    slug: str(r.slug),
    name: str(r.name),
    whatItDoes: str(r.what_it_does),
    ifUpgraded: str(r.if_upgraded),
    hpGain: num(r.hp_gain),
    isExample: r.is_example === true,
    sortOrder: num(r.sort_order) ?? 0,
  };
}

function toQuestion(r: Row): QuizQuestion {
  const choices = Array.isArray(r.choices) ? r.choices.filter((c): c is string => typeof c === "string") : [];
  return {
    id: str(r.id),
    question: str(r.question),
    choices,
    answerIndex: num(r.answer_index) ?? 0,
    isExample: r.is_example === true,
    sortOrder: num(r.sort_order) ?? 0,
  };
}

/**
 * Every list returns empty rather than throwing when Supabase is not
 * configured, so the site builds and renders in an environment without a
 * database attached. An empty gallery is a state these pages already handle,
 * because on the team's first day it is the real one.
 */
async function list(table: string, team: string): Promise<Row[]> {
  // Either key can read; the anon one is preferred so a deployment that only
  // has the publishable key still serves the site.
  const supabase = getSupabaseAnonClient() ?? getSupabaseServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("team_slug", team)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error(`[showcase] ${table}: ${error.message}`);
    return [];
  }
  return (data ?? []) as Row[];
}

export async function listCars(team: string): Promise<Car[]> {
  return (await list("showcase_cars", team)).map(toCar);
}

export async function listParts(team: string): Promise<Part[]> {
  return (await list("showcase_parts", team)).map(toPart);
}

export async function listQuiz(team: string): Promise<QuizQuestion[]> {
  return (await list("showcase_quiz", team)).map(toQuestion);
}

export async function getCar(team: string, slug: string): Promise<Car | null> {
  return (await listCars(team)).find((c) => c.slug === slug) ?? null;
}

export async function getPart(team: string, slug: string): Promise<Part | null> {
  return (await listParts(team)).find((p) => p.slug === slug) ?? null;
}

/** The parts you can bolt on, in the order the team put them in. */
export function upgradeParts(parts: Part[]): Part[] {
  return parts.filter((p) => p.hpGain !== null);
}

export type Kind = "cars" | "parts" | "quiz";

const TABLES: Record<Kind, string> = {
  cars: "showcase_cars",
  parts: "showcase_parts",
  quiz: "showcase_quiz",
};

export async function insertRow(kind: Kind, team: string, values: Row): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return "The database is not connected.";
  const { error } = await supabase.from(TABLES[kind]).insert({ ...values, team_slug: team });
  return error ? error.message : null;
}

export async function updateRow(kind: Kind, team: string, id: string, values: Row): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return "The database is not connected.";
  // Scoped by team as well as id so a guessed id from one team cannot reach
  // another team's rows once a second team has a site here.
  const { error } = await supabase
    .from(TABLES[kind])
    .update(values)
    .eq("id", id)
    .eq("team_slug", team);
  return error ? error.message : null;
}

export async function deleteRow(kind: Kind, team: string, id: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return "The database is not connected.";
  const { error } = await supabase.from(TABLES[kind]).delete().eq("id", id).eq("team_slug", team);
  return error ? error.message : null;
}

/** Read a car photo back out of the private bucket. */
export async function readMedia(path: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from("showcase-media").download(path);
  if (error || !data) return null;
  return { bytes: await data.arrayBuffer(), type: data.type || "application/octet-stream" };
}

export async function writeMedia(path: string, body: ArrayBuffer, type: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return "The database is not connected.";
  const { error } = await supabase.storage
    .from("showcase-media")
    .upload(path, body, { contentType: type, upsert: true, cacheControl: "31536000" });
  return error ? error.message : null;
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/**
 * Every source on the site, by car.
 *
 * One query rather than one per car, because the gallery wants to show which
 * cars still have no research behind them and doing that a car at a time is a
 * query per row on a page that is meant to be quick.
 */
export async function listSources(team: string): Promise<Source[]> {
  const supabase = getSupabaseAnonClient() ?? getSupabaseServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("showcase_sources")
    .select("*")
    .eq("team_slug", team)
    .order("created_at", { ascending: true });
  if (error) {
    console.error(`[showcase] sources: ${error.message}`);
    return [];
  }
  return ((data ?? []) as Row[]).map(toSource);
}

export async function sourcesForCar(team: string, carId: string): Promise<Source[]> {
  return (await listSources(team)).filter((s) => s.carId === carId);
}

export async function addSource(
  team: string,
  carId: string,
  values: { title: string; url: string; covers: string },
): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return "The database is not connected.";
  const { error } = await supabase.from("showcase_sources").insert({
    team_slug: team,
    car_id: carId,
    title: values.title,
    url: values.url,
    covers: values.covers,
  });
  return error ? error.message : null;
}

export async function removeSource(team: string, id: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return "The database is not connected.";
  const { error } = await supabase
    .from("showcase_sources")
    .delete()
    .eq("id", id)
    .eq("team_slug", team);
  return error ? error.message : null;
}

/**
 * How many sources a car has.
 *
 * The count, not the rows: this is asked on the way into a save, where the only
 * question is whether the number is zero.
 */
export async function countSources(team: string, carId: string): Promise<number> {
  const supabase = getSupabaseServiceClient() ?? getSupabaseAnonClient();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("showcase_sources")
    .select("id", { count: "exact", head: true })
    .eq("team_slug", team)
    .eq("car_id", carId);
  return error ? 0 : (count ?? 0);
}

/**
 * A stored car reduced to the columns the citation rule looks at.
 *
 * The rule is written against column names, because that is what the API
 * receives, and a Car is keyed by the camelCase names the app uses. One small
 * translation here beats two spellings of every field everywhere else.
 */
export function citedFieldsOf(car: Car | null): Record<string, string> | null {
  if (!car) return null;
  const out: Record<string, string> = { special: car.special };
  for (const field of RESEARCH_FIELDS) out[field.column] = car[field.key] as string;
  return out;
}

/** One car by id, for a save that has to check what is already stored. */
export async function getCarById(team: string, id: string): Promise<Car | null> {
  const supabase = getSupabaseServiceClient() ?? getSupabaseAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("showcase_cars")
    .select("*")
    .eq("team_slug", team)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toCar(data as Row);
}
