/** Midnight at the start of `now`'s day in America/New_York, as a Date. */
export function schoolMidnight(now: Date): Date {
  const zone = "America/New_York";
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  // "GMT-5" in winter, "GMT-4" in summer.
  const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const hours = Number(name.replace("GMT", "") || 0);
  const sign = hours <= 0 ? "-" : "+";
  return new Date(`${ymd}T00:00:00${sign}${String(Math.abs(hours)).padStart(2, "0")}:00`);
}
