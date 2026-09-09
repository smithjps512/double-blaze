/**
 * The showcase's shared vocabulary and the one rule that is pure logic.
 *
 * Split out of `showcase-db` because that module is `server-only` and this half
 * is needed in three places that are not the server: the editor is a client
 * component, the public page renders these labels, and the rule itself is worth
 * a test that does not need a database.
 *
 * No imports, nothing async, nothing that touches Supabase.
 */

/**
 * The fields a team has to go and find out, and what the form calls them.
 *
 * One list, used by the editor to build itself, by the public page to decide
 * what to show, and by the API to decide whether a save needs a source. Three
 * places that have to agree, so they read from the same array.
 */
export const RESEARCH_FIELDS = [
  { key: "manufacturer", column: "manufacturer", label: "Manufacturer", long: false },
  { key: "production", column: "production", label: "Made", long: false },
  { key: "engine", column: "engine", label: "Engine", long: false },
  { key: "transmission", column: "transmission", label: "Transmission", long: false },
  { key: "drivetrain", column: "drivetrain", label: "Drivetrain", long: false },
  { key: "chassis", column: "chassis", label: "Chassis and body", long: false },
  { key: "suspension", column: "suspension", label: "Suspension", long: false },
  { key: "brakes", column: "brakes", label: "Brakes", long: false },
  { key: "carHistory", column: "car_history", label: "The story of this car", long: true },
  { key: "makerHistory", column: "maker_history", label: "The story of who built it", long: true },
] as const;

export type ResearchKey = (typeof RESEARCH_FIELDS)[number]["key"];

/** Every column a source is required for, including the older prose field. */
export const CITED_COLUMNS: string[] = [
  ...RESEARCH_FIELDS.map((f) => f.column),
  "special",
];

/** Just enough of a car for the rule to be decided. */
export type CitedFields = Record<string, string>;

/**
 * Whether a car, as it will be once this save lands, is making a claim that
 * needs backing up.
 *
 * Merged against what is already stored rather than judged on the incoming
 * values alone. Otherwise clearing one field on a fully researched car would
 * look like a save that claims nothing, and the rule would quietly not apply to
 * the edit most likely to break a page.
 */
export function claimsSomething(
  stored: CitedFields | null,
  incoming: Record<string, unknown>,
): boolean {
  return CITED_COLUMNS.some((column) => {
    if (column in incoming) {
      const value = incoming[column];
      return typeof value === "string" && value.trim().length > 0;
    }
    return (stored?.[column] ?? "").trim().length > 0;
  });
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
