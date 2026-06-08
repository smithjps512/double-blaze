/**
 * Marketing content for the storefront. Copy is the exact text from the
 * approved homepage copy deck (docs/homepage-copy-deck.md); voice and framing
 * for the inner pages follow docs/brand-brief.md. Pricing is from spec
 * section 3 (see lib/catalog.ts).
 */

export interface ServiceCard {
  slug: string;
  title: string;
  blurb: string;
  /** Optional supporting bullets. The copy deck cards are title + body only. */
  points: string[];
}

/** Four service cards (copy deck section 4). */
export const SERVICES: ServiceCard[] = [
  {
    slug: "websites",
    title: "Websites that work",
    blurb:
      "Fast, modern sites that turn visitors into customers and look like you mean it.",
    points: [],
  },
  {
    slug: "apps",
    title: "Apps, built to ship",
    blurb:
      "Mobile and web apps from a team that builds and launches real products, not slideware.",
    points: [],
  },
  {
    slug: "marketing",
    title: "Social and digital marketing",
    blurb:
      "Show up where your customers already are, consistently and on brand.",
    points: [],
  },
  {
    slug: "consulting",
    title: "Technology consulting",
    blurb:
      "We get your process and data right before automating anything, so the technology actually pays off.",
    points: [],
  },
];

export interface SolutionCard {
  slug: string;
  title: string;
  blurb: string;
  /** e.g. "In development" (copy deck section 5). */
  tag?: string;
  /** Retained for structural compatibility; products do not map to plans. */
  outcome?: string;
  recommendedPlan?: string;
}

/** Three solution/product cards (copy deck section 5). */
export const SOLUTIONS: SolutionCard[] = [
  {
    slug: "emergency-ready",
    title: "Be ready when seconds count",
    blurb:
      "Calm guidance for everyday emergencies, from CPR to choking to allergic reactions, built with a Coast Guard veteran's field experience.",
    tag: "In development",
  },
  {
    slug: "know-the-vibe",
    title: "Know the vibe before you go",
    blurb:
      "See how busy local spots are in real time, for a packed night out or a quiet table. Good for residents, students, and the venues that host them.",
  },
  {
    slug: "local-pros",
    title: "Local pros, local jobs",
    blurb:
      "Connect with trusted local help, and create flexible work for Virginia Tech and Radford students along the way.",
  },
];

/** Proof-bar items (copy deck section 2). National brands framed as the
 * team's career experience; confirm NDA before launch (see CONTENT-NOTES). */
export const PROOF_POINTS = [
  "Our team has built for Disney, Universal, the NFL, NASCAR, Procter & Gamble, and more",
  "Veteran-owned and operated",
  "Rooted across the New River Valley, Roanoke Valley, and Martinsville/Danville",
];

/** Why-us reasons (copy deck section 6). */
export const WHY_US = [
  {
    title: "Rooted here",
    body: "We live in the valley and we are invested in its success.",
  },
  {
    title: "Enterprise experience",
    body: "National-brand depth, applied to local problems.",
  },
  {
    title: "Veteran-owned",
    body: "Service, trust, and follow-through in everything we ship.",
  },
  {
    title: "We win when you win",
    body: "Your growth is the whole point.",
  },
];
