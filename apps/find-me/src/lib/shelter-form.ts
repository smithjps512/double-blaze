/** Pure helpers for the admin "add a shelter" form. */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** The code printed in the QR poster: short, uppercase, easy to read aloud. */
export function adoptionCode(name: string, suffix = ""): string {
  const base = name
    .toUpperCase()
    .replace(/\b(THE|ANIMAL|SHELTER|HUMANE|SOCIETY|OF|AND|RESCUE|SPCA|CENTER|COUNTY)\b/g, " ")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
  const code = (base.length >= 4 ? base : (base + "PETS").slice(0, 8)) + suffix;
  return code.slice(0, 24);
}
