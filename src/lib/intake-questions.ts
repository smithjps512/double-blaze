/**
 * Program-aware intake question sets (spec section 6). Each catalog_key (the
 * four plans plus the four a-la-carte items) maps to the fields Spark needs to
 * scope that specific work. This is the editable source of truth for what
 * Spark asks; keep it human-readable so non-engineers can tune it.
 *
 * Fields are grouped for readability. Spark asks them conversationally, a few
 * at a time, and stores answers under each field `key` in
 * intake_sessions.captured. `required` marks the fields that must be captured
 * before a brief can be assembled.
 */

export interface IntakeField {
  /** Stable key used in intake_sessions.captured and the brief. */
  key: string;
  /** Short human label for the field. */
  label: string;
  /** What Spark is trying to learn; phrased as guidance, not a literal script. */
  prompt: string;
  /** Whether this must be captured before scoping the work. */
  required?: boolean;
}

export interface IntakeGroup {
  title: string;
  fields: IntakeField[];
}

export interface IntakeQuestionSet {
  catalogKey: string;
  offeringName: string;
  /** One-line framing Spark uses to open the conversation. */
  intro: string;
  groups: IntakeGroup[];
}

// ---------------------------------------------------------------------------
// Reusable field groups. Plans build on each other, so we compose shared
// groups rather than repeat them.
// ---------------------------------------------------------------------------
const businessBasics: IntakeGroup = {
  title: "Business basics",
  fields: [
    {
      key: "business_name",
      label: "Business name",
      prompt: "The name of the business this work is for.",
      required: true,
    },
    {
      key: "industry",
      label: "Industry",
      prompt: "What the business does and who it serves.",
      required: true,
    },
    {
      key: "primary_goal",
      label: "Primary goal",
      prompt:
        "The single most important outcome they want from this engagement (more sales, more leads, less manual work, etc.).",
      required: true,
    },
    {
      key: "target_customer",
      label: "Target customer",
      prompt: "Who their customers are.",
    },
    {
      key: "timeline_expectations",
      label: "Timeline expectations",
      prompt: "Any launch date or timing they are working toward.",
    },
  ],
};

const brandAndAssets: IntakeGroup = {
  title: "Brand and asset readiness",
  fields: [
    {
      key: "has_logo",
      label: "Logo and brand",
      prompt:
        "Whether they have a logo and brand colors ready, or need help establishing them.",
      required: true,
    },
    {
      key: "existing_website",
      label: "Existing website",
      prompt: "Their current website URL, if any, and what they like or dislike about it.",
    },
    {
      key: "content_readiness",
      label: "Content readiness",
      prompt:
        "What copy, photos, and other content they already have versus what they need produced.",
      required: true,
    },
    {
      key: "social_accounts",
      label: "Social accounts",
      prompt: "Which social platforms they are active on, if any.",
    },
  ],
};

const pagesAndFeatures: IntakeGroup = {
  title: "Pages and features",
  fields: [
    {
      key: "pages_needed",
      label: "Pages needed",
      prompt: "The pages the site should include (home, about, services, contact, etc.).",
      required: true,
    },
    {
      key: "key_features",
      label: "Key features",
      prompt:
        "Any specific features they need (booking, contact forms, galleries, blog, etc.).",
    },
  ],
};

const storeAndInventory: IntakeGroup = {
  title: "Store and inventory",
  fields: [
    {
      key: "product_count",
      label: "Product count",
      prompt: "Roughly how many products they sell.",
      required: true,
    },
    {
      key: "product_catalog_ready",
      label: "Catalog readiness",
      prompt:
        "Whether product details, prices, and photos are ready or need to be produced.",
      required: true,
    },
    {
      key: "payment_shipping",
      label: "Payments and shipping",
      prompt: "How they want to take payment and handle shipping or pickup.",
    },
    {
      key: "inventory_tracking",
      label: "Inventory tracking",
      prompt: "Whether they need inventory tracking and how they manage stock today.",
    },
  ],
};

const aiAndSupport: IntakeGroup = {
  title: "Automation and AI support",
  fields: [
    {
      key: "support_questions",
      label: "Common questions",
      prompt:
        "The questions customers ask most often, so AI customer support can be scoped.",
      required: true,
    },
    {
      key: "automation_targets",
      label: "Automation targets",
      prompt: "Manual tasks that eat their time and could be automated.",
    },
  ],
};

const kpiDashboardGroup: IntakeGroup = {
  title: "KPI dashboard",
  fields: [
    {
      key: "kpi_metrics",
      label: "Metrics that matter",
      prompt: "The numbers they most want to watch (revenue, orders, traffic, etc.).",
      required: true,
    },
    {
      key: "data_sources",
      label: "Data sources",
      prompt: "Where that data lives today (POS, spreadsheets, platforms).",
    },
  ],
};

const monthlyContentGroup: IntakeGroup = {
  title: "Monthly content",
  fields: [
    {
      key: "content_themes",
      label: "Content themes",
      prompt: "Topics and themes the monthly content should cover.",
      required: true,
    },
    {
      key: "brand_voice",
      label: "Brand voice",
      prompt: "How they want to sound (tone, personality, words to use or avoid).",
    },
    {
      key: "promo_calendar",
      label: "Promotions",
      prompt: "Recurring promotions, seasons, or events to plan content around.",
    },
  ],
};

const videoAndIntegrations: IntakeGroup = {
  title: "Video, training, and integrations",
  fields: [
    {
      key: "video_topics",
      label: "Video reels",
      prompt: "Subjects for monthly video reels and any footage they can provide.",
      required: true,
    },
    {
      key: "training_topics",
      label: "Training platform",
      prompt: "What they want their training platform to teach and who the audience is.",
    },
    {
      key: "integration_targets",
      label: "Third-party integrations",
      prompt:
        "Outside apps and services to integrate (DoorDash, Zillow, project tools, etc.).",
      required: true,
    },
  ],
};

const workflowSpecifics: IntakeGroup = {
  title: "Workflow specifics",
  fields: [
    {
      key: "workflow_trigger",
      label: "Trigger",
      prompt: "What starts the manual process today (an order, a form, an email).",
      required: true,
    },
    {
      key: "workflow_steps",
      label: "Steps",
      prompt: "The step-by-step manual process they want automated.",
      required: true,
    },
    {
      key: "workflow_tools",
      label: "Tools involved",
      prompt: "The apps and tools the process touches today.",
      required: true,
    },
    {
      key: "workflow_volume",
      label: "Volume",
      prompt: "How often the process runs (per day, week, or month).",
    },
    {
      key: "hosting_environment",
      label: "Hosting",
      prompt: "Where this will run, since workflow automation is client hosted.",
    },
  ],
};

const dashboardSpecifics: IntakeGroup = {
  title: "Dashboard specifics",
  fields: [
    {
      key: "dashboard_metrics",
      label: "Metrics (up to 15)",
      prompt: "The specific metrics they want on the dashboard, up to fifteen.",
      required: true,
    },
    {
      key: "data_sources",
      label: "Data sources",
      prompt: "Where each metric's data comes from (POS, spreadsheets, platforms, APIs).",
      required: true,
    },
    {
      key: "refresh_cadence",
      label: "Refresh cadence",
      prompt: "How fresh the numbers need to be (live, daily, weekly).",
    },
    {
      key: "hosting_environment",
      label: "Hosting",
      prompt: "Where this will run, since the dashboard is client hosted.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Question sets per offering.
// ---------------------------------------------------------------------------
export const INTAKE_QUESTIONS: Record<string, IntakeQuestionSet> = {
  green: {
    catalogKey: "green",
    offeringName: "Green Trail",
    intro:
      "We are scoping a Green Trail plan: a website refresh, basic ecommerce, social setup, and a daily AI post.",
    groups: [businessBasics, brandAndAssets, pagesAndFeatures, storeAndInventory],
  },
  blue: {
    catalogKey: "blue",
    offeringName: "Blue Trail",
    intro:
      "We are scoping a Blue Trail plan: everything in Green Trail plus workflow automation, AI customer support, inventory, and a KPI dashboard.",
    groups: [
      businessBasics,
      brandAndAssets,
      pagesAndFeatures,
      storeAndInventory,
      aiAndSupport,
      kpiDashboardGroup,
    ],
  },
  black: {
    catalogKey: "black",
    offeringName: "Black Trail",
    intro:
      "We are scoping a Black Trail plan: everything in Blue Trail plus monthly custom content produced by Double Blaze.",
    groups: [
      businessBasics,
      brandAndAssets,
      pagesAndFeatures,
      storeAndInventory,
      aiAndSupport,
      kpiDashboardGroup,
      monthlyContentGroup,
    ],
  },
  double_black: {
    catalogKey: "double_black",
    offeringName: "Double Black",
    intro:
      "We are scoping a Double Black plan: everything in Black Trail plus monthly video reels, a training platform, and third-party integrations.",
    groups: [
      businessBasics,
      brandAndAssets,
      pagesAndFeatures,
      storeAndInventory,
      aiAndSupport,
      kpiDashboardGroup,
      monthlyContentGroup,
      videoAndIntegrations,
    ],
  },
  site_client: {
    catalogKey: "site_client",
    offeringName: "Commerce site, your content",
    intro:
      "We are scoping a commerce site built around content you provide, with monthly maintenance.",
    groups: [businessBasics, brandAndAssets, pagesAndFeatures, storeAndInventory],
  },
  site_db: {
    catalogKey: "site_db",
    offeringName: "Commerce site, our content",
    intro:
      "We are scoping a commerce site where Double Blaze produces the copy, imagery, and product content.",
    groups: [businessBasics, brandAndAssets, pagesAndFeatures, storeAndInventory, monthlyContentGroup],
  },
  workflow: {
    catalogKey: "workflow",
    offeringName: "Workflow automation",
    intro:
      "We are scoping one automated workflow that removes a manual step from your operation.",
    groups: [businessBasics, workflowSpecifics],
  },
  dashboard: {
    catalogKey: "dashboard",
    offeringName: "Business dashboard",
    intro: "We are scoping a live business dashboard tracking up to fifteen metrics.",
    groups: [businessBasics, dashboardSpecifics],
  },
};

export function getQuestionSet(catalogKey: string): IntakeQuestionSet | null {
  return INTAKE_QUESTIONS[catalogKey] ?? null;
}

/** Flattened list of required field keys for an offering. */
export function requiredFieldKeys(catalogKey: string): string[] {
  const set = INTAKE_QUESTIONS[catalogKey];
  if (!set) return [];
  return set.groups.flatMap((g) =>
    g.fields.filter((f) => f.required).map((f) => f.key),
  );
}
