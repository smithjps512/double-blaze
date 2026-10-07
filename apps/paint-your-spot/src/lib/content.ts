/** Landing page copy that is not tied to a setting. Edit freely. */

/**
 * Step 1 is the only step happening now. The rest happen only if enough
 * staff raise a hand, and the copy says so.
 */
export const stepsFor = (goal: number, deadline: string | null) => [
  {
    title: "Raise your hand",
    body: `Happening now${deadline ? `, through ${deadline}` : ""}. No money, no commitment. We're looking for ${goal} staff. If the interest isn't there, no harm done.`,
  },
  {
    title: "Claim your lot",
    body: "If it's a go, pick your spot on a map of the Front or Back lot. First come, first painted.",
  },
  {
    title: "Submit your design",
    body: "Send a sketch and your colors. A quick check keeps it school appropriate, then it's yours.",
  },
  {
    title: "Paint and park in style",
    body: "Grab a brush or request an art student. Then enjoy the only parking spot in town with a personality.",
  },
];

export const RULES = [
  "Design must be submitted before painting: a sketch plus colors.",
  "Must include your first name or initials. Your own name only, no nicknames.",
  "School appropriate: no offensive language, images, flags, or symbols, no double meanings, no tagging. If you could not wear it on a t-shirt to school, do not paint it.",
  "Water-based exterior latex paint only. No oil-based, reflective, fluorescent, spray paint, or clearcoat.",
  "Leave 4 inches between your design and the white lines. Tape it off.",
  "Clean up your area and brushes when finished.",
  "Paint whenever you like once your design is in.",
  "Painters supply their own paint and supplies (details for art student requests coming soon).",
  "The administration may paint over designs that break the rules.",
] as const;
