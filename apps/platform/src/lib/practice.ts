/**
 * Program management positioning (brief of 2026-11-24). Double Blaze sells one
 * thing, program management, across seven practice areas. Clients pay for
 * program management only; what the program produces is included and is
 * theirs. Practice areas are named, program managers are not.
 *
 * No prices live here on purpose: price points are still being set. Copy
 * follows the brand voice in docs/brand-brief.md (plainspoken, no em dashes).
 */

export interface PracticeArea {
  slug: string;
  title: string;
  /** One line for cards. */
  summary: string;
  /** What the practice runs, for the practice areas page. */
  points: string[];
  /**
   * Env var holding this practice group's intake inbox. Unset falls back to
   * the central inbox, so leads are never dropped while inboxes are set up.
   */
  inboxEnv: string;
}

export const PRACTICE_AREAS: PracticeArea[] = [
  {
    slug: "technology",
    title: "Technology and app development",
    summary:
      "Fix the broken process first, then automate it. Custom apps and software built around how you actually work.",
    points: [
      "Process discovery, mapping, and redesign",
      "Custom web and mobile apps and internal tools",
      "Automation and integration across the systems you already run",
      "Innovation programs that modernize without starting over",
    ],
    inboxEnv: "PRACTICE_INBOX_TECHNOLOGY",
  },
  {
    slug: "people-culture",
    title: "People and culture",
    summary:
      "Human resources, culture, and inclusion programs, plus the payroll and benefits operations underneath them.",
    points: [
      "Human resource management and HR operations",
      "Culture, diversity, and inclusion programs",
      "Payroll and benefits programs",
      "People and culture software your teams actually use",
    ],
    inboxEnv: "PRACTICE_INBOX_PEOPLE",
  },
  {
    slug: "data-analytics",
    title: "Data and analytics at scale",
    summary:
      "Large-scale data and analysis across operations, finance, and order to cash, turned into decisions.",
    points: [
      "Operations and finance analytics",
      "Order to cash visibility from first touch to money in the door",
      "Reporting and dashboards leaders read every day",
      "Financial and accounting analysis tools",
    ],
    inboxEnv: "PRACTICE_INBOX_DATA",
  },
  {
    slug: "themed-experiences",
    title: "Themed destinations and experiences",
    summary:
      "From ideation to delivery: themed destinations, branded environments, and media, marrying physical, virtual, and technical.",
    points: [
      "Themed destination and attraction design, architecture, and build",
      "Themed entertainment and event design",
      "Branded marketing displays and trade show environments",
      "Experiences that blend physical, virtual, and technical components",
      "Media and content: recorded and live video production, and a game studio",
    ],
    inboxEnv: "PRACTICE_INBOX_EXPERIENCES",
  },
  {
    slug: "facility-management",
    title: "Facility management",
    summary:
      "Programs that keep buildings, campuses, and venues running, maintained, and ready.",
    points: [
      "Facility operations and maintenance programs",
      "Vendor and contract coordination",
      "Moves, renovations, and space planning",
    ],
    inboxEnv: "PRACTICE_INBOX_FACILITIES",
  },
  {
    slug: "event-management",
    title: "Event management",
    summary:
      "Conferences, launches, and public events, planned and led from first idea to final walk-through.",
    points: [
      "Event strategy, planning, and budgeting",
      "Venue, vendor, and stakeholder management",
      "Run of show and on-site leadership",
    ],
    inboxEnv: "PRACTICE_INBOX_EVENTS",
  },
  {
    slug: "event-operations",
    title: "Event operations",
    summary:
      "The logistics behind the event: staffing, safety, flow, and everything that has to work on the day.",
    points: [
      "Logistics, staffing, and credentialing",
      "Guest flow, safety, and operations planning",
      "Load-in, load-out, and post-event review",
    ],
    inboxEnv: "PRACTICE_INBOX_EVENT_OPS",
  },
];

export function getPracticeArea(slug: string): PracticeArea | undefined {
  return PRACTICE_AREAS.find((p) => p.slug === slug);
}

/** The name of step 1, the bundled discovery and design product. */
export const TRAIL_MAP = "Trail Map";

/** The four-step engagement menu (James, 2026-11-25). Step 1, the Trail Map,
 * bundles the old Discovery, Define, and Design and architect phases into one
 * product with a document the client owns. New work on something that already
 * exists starts again at step 1, usually with a much shorter Trail Map. */
export interface Phase {
  n: number;
  title: string;
  summary: string;
  outcome: string;
}

export const PHASES: Phase[] = [
  {
    n: 1,
    title: TRAIL_MAP,
    summary:
      "We learn your goals, your people, and how the work happens today, then define and design the solution: architecture, blueprints, art concepts, and, for automation, the process map.",
    outcome:
      "A design and architecture document you own, detailed enough for any qualified builder to price accurately.",
  },
  {
    n: 2,
    title: "Build and test",
    summary:
      "Software, apps, and games are built in short rounds, each one tested with the people who will use it, until it is right. Physical builds are measure twice, cut once.",
    outcome: "A finished deliverable, proven before it goes live.",
  },
  {
    n: 3,
    title: "Deliver",
    summary: "Launch, training, and handoff, so your team is ready on day one.",
    outcome: "A live program your people know how to run.",
  },
  {
    n: 4,
    title: "Maintain",
    summary:
      "Updates, changes, and support for as long as you want us, on a monthly program management retainer.",
    outcome: "A program that keeps working after launch day.",
  },
];

/** What the Trail Map document contains. */
export const TRAIL_MAP_INCLUDES = [
  "Goals, scope, requirements, and success measures",
  "Design and architecture: blueprints, art concepts, prototypes",
  "Process map and process management plan, when the work is automation",
  "Build cost estimate for physical work and labor, passed through at cost",
  "What to ask bidders: a scope checklist and an evaluation sheet",
];

/** What the program produces, included in the program management fee. */
export const INCLUDED_DELIVERABLES = [
  "Software, apps, and automation",
  "UX and UI design",
  "Games",
  "Video editing",
  "Art concepts for themed destinations and physical builds",
  "Blueprints for themed destinations and physical builds",
  "Financial and accounting analysis software",
  "Payroll and people and culture software",
];

export interface Audience {
  title: string;
  body: string;
}

export const AUDIENCES: Audience[] = [
  {
    title: "Small and midsize businesses",
    body: "Big-program discipline at a price built for smaller budgets.",
  },
  {
    title: "Large enterprises",
    body: "Senior program leadership that brings in the right experts as the work demands.",
  },
  {
    title: "Government agencies",
    body: "Local, state, and federal agencies and departments, with a government menu built for procurement.",
  },
  {
    title: "Government contractors",
    body: "A program management partner for the agencies and contracts you already serve.",
  },
];

/** Team career experience, framed as the team's history rather than Double
 * Blaze company projects (brand brief). Cleared by James 2026-11-24; LCRA is
 * under NDA, so it appears only as "major power companies". */
export const EXPERIENCE = [
  "Disney",
  "Universal",
  "the NFL",
  "NASCAR",
  "Procter & Gamble",
  "SeaWorld",
  "Atlantis Resorts",
  "IMG Worlds of Adventure",
  "the Pittsburgh Steelers",
  "the Tampa Bay Buccaneers",
  "the State of Texas",
  "major power companies",
  "Proof Advertising",
  "Everest Institute",
  "Integrated Human Capital",
];

/**
 * Published price menu, approved by James on 2026-11-24 (strategy doc
 * "Double Blaze Strategy: Positioning, Pricing and Site"), restructured into
 * four steps on 2026-11-25. Trail Map and Build are fixed fees, Deliver comes
 * with Build, and Maintain is a monthly retainer. The full Trail Map fee is
 * credited toward Build when the client builds with us. Tier is set by program
 * complexity, never by users. Enterprise prices are floors.
 */
export interface PriceTier {
  slug: "starter" | "growth" | "enterprise";
  name: string;
  fit: string;
  /** Step 1, the Trail Map, in USD. Covers the old Discovery, Define, and
   * Design and architect phases; rounded prices set by James 2026-11-25. */
  trailMap: number;
  /** Step 2, Build and test, in USD. Deliver comes with it. */
  build: number;
  monthly: number;
  from: boolean;
}

export const PRICE_TIERS: PriceTier[] = [
  {
    slug: "starter",
    name: "Starter",
    fit: "One team or location, one main workflow, up to 2 integrations, and 1 or 2 decision makers.",
    trailMap: 7500,
    build: 7500,
    monthly: 500,
    from: false,
  },
  {
    slug: "growth",
    name: "Growth",
    fit: "Several departments or sites, up to 6 integrations, and a steering group.",
    trailMap: 25000,
    build: 30000,
    monthly: 2000,
    from: false,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    fit: "Organization-wide or multi-site, regulated data, many stakeholders, or a physical build.",
    trailMap: 75000,
    build: 100000,
    monthly: 6000,
    from: true,
  },
];

/** Government pays the published commercial price less this percentage. */
export const GOVERNMENT_DISCOUNT_PCT = 10;

export function formatPrice(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/** Offices: Austin is the central office, then the rest in display order. */
export const HEADQUARTERS = { city: "Austin", state: "TX" };

export const OFFICES = [
  { city: "Austin", state: "TX" },
  { city: "San Antonio", state: "TX" },
  { city: "Dallas", state: "TX" },
  { city: "Houston", state: "TX" },
  { city: "Chicago", state: "IL" },
  { city: "New York", state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "Orlando", state: "FL" },
  { city: "Miami", state: "FL" },
  { city: "Tampa / St. Petersburg", state: "FL" },
  { city: "Washington", state: "DC" },
  { city: "Philadelphia", state: "PA" },
];

export const WHY_US = [
  {
    title: "Program management is the product",
    body: "It is the one thing we sell, so it is the one thing we have to be the best at.",
  },
  {
    title: "Expertise on demand",
    body: "Seven practice areas under one roof, and we bring in specialists when the work calls for them.",
  },
  {
    title: "You own what we build",
    body: "Deliverables are yours, with unlimited users and no license fees. No lock-in.",
  },
  {
    title: "Veteran-owned",
    body: "Service, trust, and follow-through in every program we run.",
  },
];

/** The price of one step for one tier, as shown on the site. */
export function stepPrice(tier: PriceTier, n: number): string {
  const from = tier.from ? "from " : "";
  if (n === 1) return `${from}${formatPrice(tier.trailMap)}`;
  if (n === 2) return `${from}${formatPrice(tier.build)}`;
  if (n === 3) return "Included with Build";
  return `${from}${formatPrice(tier.monthly)} a month`;
}
