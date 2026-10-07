import {
  INTEREST_LEVELS,
  INTERESTS,
  KEEP_YEARLY,
  LOTS,
  PAINTERS,
  PRICE_COMFORT,
  ROLES,
  labelFor,
  type ResponseRow,
} from "./survey";

export interface Tally {
  value: string;
  label: string;
  count: number;
}

export interface Summary {
  total: number;
  interested: number;
  byLevel: Tally[];
  byInterest: Tally[];
  byLot: Tally[];
  byPainter: Tally[];
  byPrice: Tally[];
  byKeep: Tally[];
  byRole: Tally[];
  artStudentRequests: number;
  bossInterest: number;
}

function tally(
  options: readonly { value: string; label: string }[],
  rows: ResponseRow[],
  get: (r: ResponseRow) => string | string[],
): Tally[] {
  return options.map((o) => ({
    value: o.value,
    label: o.label,
    count: rows.filter((r) => {
      const v = get(r);
      return Array.isArray(v) ? v.includes(o.value) : v === o.value;
    }).length,
  }));
}

export function summarize(rows: ResponseRow[]): Summary {
  const byInterest = tally(INTERESTS, rows, (r) => r.interests);
  const byPainter = tally(PAINTERS, rows, (r) => r.painter);
  return {
    total: rows.length,
    interested: rows.filter((r) => r.interest_level === "in" || r.interest_level === "probably").length,
    byLevel: tally(INTEREST_LEVELS, rows, (r) => r.interest_level),
    byInterest,
    byLot: tally(LOTS, rows, (r) => r.preferred_lot),
    byPainter,
    byPrice: tally(PRICE_COMFORT, rows, (r) => r.price_comfort),
    byKeep: tally(KEEP_YEARLY, rows, (r) => r.keep_yearly),
    byRole: tally(ROLES, rows, (r) => r.role),
    artStudentRequests: byPainter.find((t) => t.value === "art_student")?.count ?? 0,
    bossInterest: byInterest.find((t) => t.value === "boss")?.count ?? 0,
  };
}

export interface Filters {
  level?: string;
  lot?: string;
  interest?: string;
}

export function applyFilters(rows: ResponseRow[], f: Filters): ResponseRow[] {
  return rows.filter(
    (r) =>
      (!f.level || r.interest_level === f.level) &&
      (!f.lot || r.preferred_lot === f.lot) &&
      (!f.interest || r.interests.includes(f.interest as ResponseRow["interests"][number])),
  );
}

/** One field of a CSV row, quoted when it needs to be, and safe to open in a spreadsheet. */
export function csvField(value: string): string {
  // A leading = + - @ makes Excel and Sheets treat the cell as a formula.
  const neutered = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(neutered) ? `"${neutered.replace(/"/g, '""')}"` : neutered;
}

export function toCsv(rows: ResponseRow[]): string {
  const header = [
    "Name",
    "Email",
    "Role",
    "Interest level",
    "Interested in",
    "Preferred lot",
    "Who paints",
    "Keep year to year",
    "Price comfort",
    "Comments",
    "Submitted",
    "Last updated",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      labelFor(ROLES, r.role),
      labelFor(INTEREST_LEVELS, r.interest_level),
      r.interests.map((i) => labelFor(INTERESTS, i)).join("; "),
      labelFor(LOTS, r.preferred_lot),
      labelFor(PAINTERS, r.painter),
      labelFor(KEEP_YEARLY, r.keep_yearly),
      labelFor(PRICE_COMFORT, r.price_comfort),
      r.comments ?? "",
      r.created_at,
      r.updated_at,
    ]
      .map(csvField)
      .join(","),
  );
  return [header.join(","), ...lines].join("\r\n") + "\r\n";
}
