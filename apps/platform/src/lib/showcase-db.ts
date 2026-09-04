import "server-only";
import { getSupabaseAnonClient, getSupabaseServiceClient } from "./supabase";

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

/**
 * A url-safe name, used when the team adds a car.
 *
 * Falls back to a timestamp rather than an empty string: a car called "!!!" is
 * a thing a thirteen year old will absolutely try, and it should get a working
 * page rather than a 404.
 */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || `item-${Date.now().toString(36)}`;
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
