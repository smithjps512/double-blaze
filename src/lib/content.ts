/**
 * Marketing content for the storefront. Derived from the spec's capability set
 * (sections 1 and 3) and the brand idea. NOTE: the approved homepage copy deck
 * and brand brief were not present in the repo at build time; this copy is
 * written to the brand and is the intended swap-in point for the final deck.
 */

export interface ServiceCard {
  slug: string;
  title: string;
  blurb: string;
  points: string[];
}

/** Four service cards (homepage layout calls for exactly four). */
export const SERVICES: ServiceCard[] = [
  {
    slug: "websites-ecommerce",
    title: "Websites & ecommerce",
    blurb:
      "A site that looks the part and sells. Built fast, easy to run, ready for customers on day one.",
    points: [
      "Website refresh or new build",
      "Online store and checkout",
      "Mobile-first and quick to load",
    ],
  },
  {
    slug: "workflow-automation",
    title: "Workflow automation",
    blurb:
      "Stop doing the same task twice. We automate the busywork so your team spends time on customers.",
    points: [
      "Order, inventory, and intake flows",
      "Connects the tools you already use",
      "Priced per workflow",
    ],
  },
  {
    slug: "ai-content-support",
    title: "AI content & support",
    blurb:
      "Show up every day and answer every question, without adding a person to payroll.",
    points: [
      "Daily AI social posts",
      "AI customer support",
      "Monthly content we produce for you",
    ],
  },
  {
    slug: "dashboards-insights",
    title: "Dashboards & insights",
    blurb:
      "See the numbers that move your business, in one place, updated as they change.",
    points: [
      "KPI dashboard, up to 15 metrics",
      "Sales, inventory, and traffic",
      "Built to your business, not a template",
    ],
  },
];

export interface SolutionCard {
  slug: string;
  title: string;
  outcome: string;
  blurb: string;
  /** Plan slug this solution points buyers toward. */
  recommendedPlan: string;
}

/** Three solution cards (homepage layout calls for exactly three). */
export const SOLUTIONS: SolutionCard[] = [
  {
    slug: "get-online",
    title: "Get online",
    outcome: "For businesses that need a real presence and a way to sell.",
    blurb:
      "A refreshed site, a working store, and a social presence that posts every day. The trailhead.",
    recommendedPlan: "green-trail",
  },
  {
    slug: "run-leaner",
    title: "Run leaner",
    outcome: "For businesses ready to automate and watch the numbers.",
    blurb:
      "Add automation, AI support, inventory, and a live dashboard so the operation runs itself between visits.",
    recommendedPlan: "blue-trail",
  },
  {
    slug: "scale-up",
    title: "Scale up",
    outcome: "For businesses that want the whole operation built and run.",
    blurb:
      "Monthly content, video, training, and integrations. We handle the digital side so you handle the business.",
    recommendedPlan: "double-black",
  },
];

/** Proof-bar items. Replace with real, verifiable claims before launch. */
export const PROOF_POINTS = [
  "Veteran-owned",
  "Based in Virginia",
  "Plans from $199/mo",
  "Built on a 12-month partnership",
];

/** Why-us reasons for the why-us band. */
export const WHY_US = [
  {
    title: "Veteran-owned and accountable",
    body: "A certified veteran-owned small business. One project lead, on the record, from kickoff through every monthly delivery.",
  },
  {
    title: "Built for small business",
    body: "No enterprise jargon and no bloated retainers. Clear plans, plain pricing, and tools sized to your shop.",
  },
  {
    title: "A guided path, not a handoff",
    body: "Our Spark intake captures what your project needs, we draft the brief, and you approve the scope before work starts.",
  },
  {
    title: "We do the work, monthly",
    body: "Higher tiers include content, video, and updates produced by our team. You get deliverables, not homework.",
  },
];
