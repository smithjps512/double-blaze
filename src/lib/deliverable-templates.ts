/**
 * Deliverable templates per offering (spec sections 1 and 6). Keyed by
 * catalog_key, each template defines the concrete deliverables and the monthly
 * cadence for the work. On brief acceptance these become the project's initial
 * `deliverables` rows with monthly-cadence due dates (workflow step 4).
 *
 * Editable source of truth: change titles, descriptions, or month offsets here
 * and acceptance will generate the new schedule. Generation is idempotent - the
 * acceptance path only creates deliverables when none exist for the project.
 */

export interface DeliverableTemplateItem {
  title: string;
  description: string;
  /**
   * Whole months from project start that this deliverable is due. 0 = first
   * month (kickoff/setup work), 1 = month one, etc.
   */
  monthOffset: number;
}

export interface DeliverableTemplate {
  catalogKey: string;
  /** How the work recurs. Plans run monthly; a-la-carte builds are one-time. */
  cadence: "monthly" | "one_time";
  /** Plain-language description of the monthly rhythm, shown in the brief. */
  cadenceSummary: string;
  items: DeliverableTemplateItem[];
}

export const DELIVERABLE_TEMPLATES: Record<string, DeliverableTemplate> = {
  green: {
    catalogKey: "green",
    cadence: "monthly",
    cadenceSummary:
      "Monthly plan: site goes live in month one, then one AI-written social post per day with a monthly check-in.",
    items: [
      {
        title: "Website refresh live",
        description: "Refreshed website designed, built, and launched.",
        monthOffset: 0,
      },
      {
        title: "Basic ecommerce store live",
        description: "Storefront configured with products, payments, and checkout.",
        monthOffset: 0,
      },
      {
        title: "Social accounts set up",
        description: "Social profiles created or refreshed and connected.",
        monthOffset: 0,
      },
      {
        title: "Daily AI posts - month 1",
        description: "One AI-written social post per day for the first month.",
        monthOffset: 1,
      },
    ],
  },
  blue: {
    catalogKey: "blue",
    cadence: "monthly",
    cadenceSummary:
      "Monthly plan: Green Trail setup plus automation, AI support, inventory, and a KPI dashboard, with ongoing monthly delivery.",
    items: [
      {
        title: "Website refresh live",
        description: "Refreshed website designed, built, and launched.",
        monthOffset: 0,
      },
      {
        title: "Ecommerce and inventory live",
        description: "Storefront with checkout and inventory tracking configured.",
        monthOffset: 0,
      },
      {
        title: "Workflow automation configured",
        description: "First automation built to remove a manual step.",
        monthOffset: 0,
      },
      {
        title: "AI customer support live",
        description: "AI support assistant trained on common questions and deployed.",
        monthOffset: 1,
      },
      {
        title: "KPI dashboard live",
        description: "Dashboard connected to data sources and tracking key metrics.",
        monthOffset: 1,
      },
      {
        title: "Daily AI posts - month 1",
        description: "One AI-written social post per day for the first month.",
        monthOffset: 1,
      },
    ],
  },
  black: {
    catalogKey: "black",
    cadence: "monthly",
    cadenceSummary:
      "Monthly plan: Blue Trail capabilities plus custom monthly content produced by Double Blaze.",
    items: [
      {
        title: "Website refresh live",
        description: "Refreshed website designed, built, and launched.",
        monthOffset: 0,
      },
      {
        title: "Ecommerce and inventory live",
        description: "Storefront with checkout and inventory tracking configured.",
        monthOffset: 0,
      },
      {
        title: "Workflow automation configured",
        description: "First automation built to remove a manual step.",
        monthOffset: 0,
      },
      {
        title: "AI customer support and KPI dashboard live",
        description: "AI support assistant and KPI dashboard deployed.",
        monthOffset: 1,
      },
      {
        title: "Monthly custom content - month 1",
        description: "Custom content package produced by Double Blaze.",
        monthOffset: 1,
      },
      {
        title: "Promo and product updates - month 1",
        description: "Promotional and product updates published.",
        monthOffset: 1,
      },
    ],
  },
  double_black: {
    catalogKey: "double_black",
    cadence: "monthly",
    cadenceSummary:
      "Monthly plan: Black Trail capabilities plus monthly video reels, a training platform, and third-party integrations.",
    items: [
      {
        title: "Website refresh live",
        description: "Refreshed website designed, built, and launched.",
        monthOffset: 0,
      },
      {
        title: "Ecommerce, inventory, and automation live",
        description: "Storefront, inventory tracking, and first automation configured.",
        monthOffset: 0,
      },
      {
        title: "Third-party integrations configured",
        description: "Outside apps and services integrated.",
        monthOffset: 1,
      },
      {
        title: "Training platform live",
        description: "Training platform stood up with initial content.",
        monthOffset: 1,
      },
      {
        title: "Monthly custom content - month 1",
        description: "Custom content package produced by Double Blaze.",
        monthOffset: 1,
      },
      {
        title: "Monthly video reels - month 1",
        description: "Monthly video reels produced and published.",
        monthOffset: 1,
      },
    ],
  },
  site_client: {
    catalogKey: "site_client",
    cadence: "one_time",
    cadenceSummary:
      "One-time build with monthly maintenance. Content is provided by the client.",
    items: [
      {
        title: "Design approved",
        description: "Site design produced and approved by the client.",
        monthOffset: 0,
      },
      {
        title: "Commerce site built",
        description: "Ecommerce site built around client-provided content.",
        monthOffset: 0,
      },
      {
        title: "Site launched",
        description: "Site launched and handed off, maintenance begins.",
        monthOffset: 1,
      },
    ],
  },
  site_db: {
    catalogKey: "site_db",
    cadence: "one_time",
    cadenceSummary:
      "One-time build with monthly maintenance. Double Blaze produces the content.",
    items: [
      {
        title: "Content produced",
        description: "Copy, imagery, and product content produced by Double Blaze.",
        monthOffset: 0,
      },
      {
        title: "Design approved",
        description: "Site design produced and approved by the client.",
        monthOffset: 0,
      },
      {
        title: "Commerce site built",
        description: "Ecommerce site built with Double Blaze content.",
        monthOffset: 1,
      },
      {
        title: "Site launched",
        description: "Site launched and handed off, maintenance begins.",
        monthOffset: 1,
      },
    ],
  },
  workflow: {
    catalogKey: "workflow",
    cadence: "one_time",
    cadenceSummary: "One-time build, client hosted. No ongoing maintenance.",
    items: [
      {
        title: "Workflow mapped",
        description: "Manual process mapped end to end and automation plan confirmed.",
        monthOffset: 0,
      },
      {
        title: "Automation built and tested",
        description: "Automation built, tested, and validated against real cases.",
        monthOffset: 0,
      },
      {
        title: "Automation deployed",
        description: "Automation deployed to the client's environment and handed off.",
        monthOffset: 1,
      },
    ],
  },
  dashboard: {
    catalogKey: "dashboard",
    cadence: "one_time",
    cadenceSummary: "One-time build, client hosted. No ongoing maintenance.",
    items: [
      {
        title: "Metrics and sources confirmed",
        description: "Up to fifteen metrics and their data sources confirmed.",
        monthOffset: 0,
      },
      {
        title: "Dashboard built",
        description: "Dashboard built and connected to data sources.",
        monthOffset: 0,
      },
      {
        title: "Dashboard deployed",
        description: "Dashboard deployed to the client's environment and handed off.",
        monthOffset: 1,
      },
    ],
  },
};

export function getDeliverableTemplate(
  catalogKey: string,
): DeliverableTemplate | null {
  return DELIVERABLE_TEMPLATES[catalogKey] ?? null;
}

/** A deliverable row ready to insert, computed from the template and a start date. */
export interface PlannedDeliverable {
  title: string;
  description: string;
  due_date: string; // YYYY-MM-DD
}

/**
 * Build the initial deliverable rows for a project from its template, with
 * monthly-cadence due dates measured from `startDate`.
 */
export function buildInitialDeliverables(
  catalogKey: string,
  startDate: Date,
): PlannedDeliverable[] {
  const template = getDeliverableTemplate(catalogKey);
  if (!template) return [];
  return template.items.map((item) => {
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + item.monthOffset);
    return {
      title: item.title,
      description: item.description,
      due_date: due.toISOString().slice(0, 10),
    };
  });
}
