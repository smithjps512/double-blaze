/** Landing page copy that is not tied to a setting. Edit freely. */

/** What the survey is for, said the same way everywhere it appears. */
export const commitmentLine = (goal: number) =>
  `This is just establishing we have enough interest to do this fundraiser. There's no commitment from you until we get ${goal} folks who are interested.`;

/**
 * Step 1 is the only step happening now. The rest happen only if enough
 * staff raise a hand, and the copy says so.
 */
export const stepsFor = (goal: number, deadline: string | null) => [
  {
    title: "Raise your hand",
    body: `Happening now${deadline ? `, through ${deadline}` : ""}. ${commitmentLine(goal)}`,
  },
  {
    title: "Claim your lot",
    body: "If it's a go, pick your spot on a map of the Front or Back lot. First come, first painted.",
  },
  {
    title: "Paint and park in style",
    body: "Grab a brush and make it yours. Then enjoy the only parking spot in town with a personality.",
  },
];

export const RULES = [
  "Must include your first name or initials. Your own name only, no nicknames.",
  "School appropriate: no offensive language, images, flags, or symbols, no double meanings, no tagging. If you could not wear it on a t-shirt to school, do not paint it. If you would not wear it to school (as a teacher), do not paint it in your spot.",
  "Water-based exterior latex paint only. No oil-based, reflective, fluorescent, spray paint, or clearcoat.",
  "Leave 4 inches between your design and the white lines. Tape it off.",
  "Clean up your area and brushes when finished.",
  "Paint whenever you like once your spot is yours.",
  "Painters supply their own paint and supplies.",
  "The administration may paint over designs that break the rules.",
] as const;
