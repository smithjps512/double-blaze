/**
 * Which team's rows this site reads.
 *
 * A constant rather than a route parameter: the schema is keyed by team so the
 * next team without a developer costs a row, but this particular site is the
 * Classic Cars site and pretending otherwise would add a layer of indirection
 * nobody asked for yet.
 */
export const TEAM = "period-2-classic-cars";
