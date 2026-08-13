/**
 * Trail Run intake and build-checklist definitions (Sprint T2).
 *
 * Everyone in Trail Run runs on Blue Trail, so there is one standardized intake
 * (the seven areas below) and one standardized build checklist (the seven Blue
 * Trail tasks). This module is pure and framework-free: it holds the question
 * set, the checklist seed, and small helpers, so it can be unit tested and
 * shared by server code and prompts. Keep Anthropic and Supabase out of it.
 *
 * No em dashes anywhere, per the house rule.
 */

export interface IntakeField {
  /** Stable key used in captured_fields and the build brief. */
  key: string;
  label: string;
  /** Plain-language prompt Spark uses to ask for this field. */
  prompt: string;
  required: boolean;
}

export interface IntakeGroup {
  title: string;
  fields: IntakeField[];
}

/** The seven Trail Run intake areas (program brief section 6). */
export const TRAIL_RUN_INTAKE: { intro: string; groups: IntakeGroup[] } = {
  intro:
    "We build your Blue Trail solution first, then you run it for 30 days. This intake captures what we need to build it well.",
  groups: [
    {
      title: "Business profile",
      fields: [
        { key: "business_name", label: "Business name", prompt: "What is the name of your business?", required: true },
        { key: "location", label: "Location", prompt: "Where are you located, city and state?", required: true },
        { key: "region", label: "Region", prompt: "Which area do you mainly serve?", required: false },
        { key: "what_you_do", label: "What you do", prompt: "In a sentence or two, what does your business do?", required: true },
        { key: "who_you_serve", label: "Who you serve", prompt: "Who are your customers?", required: true },
      ],
    },
    {
      title: "Goals",
      fields: [
        { key: "primary_goal", label: "Primary goal", prompt: "What do you most want this to accomplish in the first 30 days?", required: true },
      ],
    },
    {
      title: "Current web presence",
      fields: [
        { key: "existing_site", label: "Existing site", prompt: "Do you have a website or social accounts now? Share the links if so.", required: false },
        { key: "keep_or_replace", label: "Keep or replace", prompt: "What should we keep, and what should we replace?", required: false },
      ],
    },
    {
      title: "Brand assets",
      fields: [
        { key: "brand_assets", label: "Brand assets", prompt: "Do you have a logo, brand colors, photos, or copy? Share links or describe what you have.", required: false },
      ],
    },
    {
      title: "Products and services",
      fields: [
        { key: "products_services", label: "Products and services", prompt: "Tell us about your products and services, enough for us to stand up basic ecommerce and inventory.", required: true },
      ],
    },
    {
      title: "Priority workflow",
      fields: [
        { key: "priority_workflow", label: "Priority workflow", prompt: "What is the single process that eats the most of your time that you want automated? Walk us through the steps.", required: true },
      ],
    },
    {
      title: "Target KPIs",
      fields: [
        { key: "target_kpis", label: "Target KPIs", prompt: "Which few numbers do you most care about, so your dashboard and check-ins show what matters to you?", required: true },
      ],
    },
  ],
};

/** Keys of the fields that must be captured before we assemble the brief. */
export function requiredIntakeFieldKeys(): string[] {
  return TRAIL_RUN_INTAKE.groups
    .flatMap((g) => g.fields)
    .filter((f) => f.required)
    .map((f) => f.key);
}

/** True when every required field has a non-empty value in `captured`. */
export function intakeComplete(captured: Record<string, unknown>): boolean {
  return requiredIntakeFieldKeys().every((k) => {
    const v = captured[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
}

export type BuildTaskType =
  | "website"
  | "ecommerce"
  | "social"
  | "workflow"
  | "ai_support"
  | "inventory"
  | "kpi_dashboard";

export interface BuildTaskSeed {
  task_type: BuildTaskType;
  title: string;
  notes: string | null;
  sort_order: number;
}

/** The standardized Blue Trail build checklist (program brief section 3). */
const BLUE_TRAIL_TASKS: Array<{ task_type: BuildTaskType; title: string }> = [
  { task_type: "website", title: "Website, new build or refresh" },
  { task_type: "ecommerce", title: "Basic ecommerce" },
  { task_type: "social", title: "Social setup with one daily AI post" },
  { task_type: "workflow", title: "One workflow automation" },
  { task_type: "ai_support", title: "AI customer support" },
  { task_type: "inventory", title: "Inventory" },
  { task_type: "kpi_dashboard", title: "KPI dashboard" },
];

/**
 * Builds the seven Blue Trail build_tasks for a new build. The workflow task is
 * prefilled from the priority workflow, and the KPI dashboard task is
 * configured to the client's target KPIs, both pulled from the brief.
 */
export function buildTaskSeeds(opts: {
  priorityWorkflow?: string | null;
  targetKpis?: string | null;
}): BuildTaskSeed[] {
  return BLUE_TRAIL_TASKS.map((t, i) => {
    let notes: string | null = null;
    if (t.task_type === "workflow" && opts.priorityWorkflow?.trim()) {
      notes = `Automate from intake: ${opts.priorityWorkflow.trim()}`;
    }
    if (t.task_type === "kpi_dashboard" && opts.targetKpis?.trim()) {
      notes = `Configure to client KPIs: ${opts.targetKpis.trim()}`;
    }
    return { task_type: t.task_type, title: t.title, notes, sort_order: i };
  });
}

/**
 * Deterministic backstop for the feasibility check. The brief assembly asks the
 * model to flag anything outside the standardized Blue Trail build; this scans
 * captured intake for common out-of-scope signals (custom integrations, ERPs,
 * and the like) so an obvious flag is never missed. Non-blocking: flags are for
 * a human to review.
 */
const OUT_OF_SCOPE_SIGNALS: Array<{ pattern: RegExp; flag: string }> = [
  { pattern: /\b(custom )?integrat(e|ion)\b/i, flag: "Mentions a custom integration, which may be outside the standardized Blue Trail build." },
  { pattern: /\b(erp|salesforce|netsuite|sap|quickbooks|hubspot)\b/i, flag: "Names a third-party system that may need a custom integration." },
  { pattern: /\b(api|webhook)s?\b/i, flag: "Mentions APIs or webhooks, which may require custom work beyond the starter build." },
  { pattern: /\b(mobile app|ios|android)\b/i, flag: "Mentions a mobile app, which is outside the standardized website build." },
  { pattern: /\b(multi[- ]?location|franchise|wholesale|b2b portal)\b/i, flag: "Mentions multi-location or B2B needs that may exceed the starter scope." },
];

export function backstopFeasibilityFlags(captured: Record<string, unknown>): string[] {
  const haystack = Object.values(captured)
    .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
    .join("\n");
  const flags: string[] = [];
  for (const { pattern, flag } of OUT_OF_SCOPE_SIGNALS) {
    if (pattern.test(haystack)) flags.push(flag);
  }
  return flags;
}

/** Merge model-produced and backstop flags, de-duplicated, order preserved. */
export function mergeFeasibilityFlags(
  modelFlags: string[],
  backstopFlags: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of [...modelFlags, ...backstopFlags]) {
    const key = f.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(f.trim());
  }
  return out;
}
