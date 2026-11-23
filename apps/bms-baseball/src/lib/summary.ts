import { GRADES, POSITIONS, playedWhereLabel, positionLabel, yearsLabel } from "./signup";

/** One row of bmsb_signups, as the database returns it. */
export interface SignupRow {
  id: string;
  first_name: string;
  last_name: string;
  grade: number;
  positions: string[];
  years_played: number;
  played_where: string[];
  team_names: string | null;
  notes: string | null;
  created_at: string;
}

export interface Summary {
  total: number;
  byGrade: { grade: number; count: number }[];
  byPosition: { id: string; label: string; count: number }[];
  firstTimers: number;
}

export function summarize(rows: SignupRow[]): Summary {
  return {
    total: rows.length,
    byGrade: GRADES.map((grade) => ({ grade, count: rows.filter((r) => r.grade === grade).length })),
    byPosition: POSITIONS.map((p) => ({
      id: p.id,
      label: p.label,
      count: rows.filter((r) => r.positions.includes(p.id)).length,
    })),
    firstTimers: rows.filter((r) => r.years_played === 0).length,
  };
}

export interface Filters {
  grade?: number;
  position?: string;
}

export function applyFilters(rows: SignupRow[], filters: Filters): SignupRow[] {
  return rows.filter(
    (r) =>
      (filters.grade == null || r.grade === filters.grade) &&
      (!filters.position || r.positions.includes(filters.position)),
  );
}

/**
 * Quote a CSV cell. A leading = + - @ (or tab or return) is prefixed with an
 * apostrophe so Excel or Sheets never runs a kid's answer as a formula.
 */
export function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: SignupRow[]): string {
  const header = [
    "Signed up",
    "First name",
    "Last name",
    "Grade",
    "Positions",
    "Experience",
    "Years played",
    "Played where",
    "Teams",
    "Notes",
  ];
  const lines = rows.map((r) =>
    [
      r.created_at.slice(0, 10),
      r.first_name,
      r.last_name,
      r.grade,
      r.positions.map(positionLabel).join("; "),
      yearsLabel(r.years_played),
      r.years_played,
      r.played_where.map(playedWhereLabel).join("; "),
      r.team_names,
      r.notes,
    ]
      .map(csvCell)
      .join(","),
  );
  // Byte order mark so Excel opens it as UTF-8.
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
