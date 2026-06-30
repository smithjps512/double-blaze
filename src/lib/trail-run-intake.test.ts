/**
 * Unit tests for the Trail Run intake/checklist pure helpers. Run with:
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requiredIntakeFieldKeys,
  intakeComplete,
  buildTaskSeeds,
  backstopFeasibilityFlags,
  mergeFeasibilityFlags,
} from "./trail-run-intake";

const COMPLETE = {
  business_name: "Trailhead Coffee",
  location: "Blacksburg, VA",
  what_you_do: "We roast and sell coffee",
  who_you_serve: "Local cafes and home brewers",
  primary_goal: "More online orders",
  products_services: "Whole bean and ground coffee, subscriptions",
  priority_workflow: "Taking and fulfilling wholesale orders",
  target_kpis: "Online orders, repeat customers",
};

test("requiredIntakeFieldKeys lists the required fields", () => {
  const keys = requiredIntakeFieldKeys();
  assert.ok(keys.includes("business_name"));
  assert.ok(keys.includes("priority_workflow"));
  assert.ok(keys.includes("target_kpis"));
  // Optional fields are not required.
  assert.ok(!keys.includes("existing_site"));
  assert.ok(!keys.includes("brand_assets"));
});

test("intakeComplete requires every required field non-empty", () => {
  assert.equal(intakeComplete(COMPLETE), true);
  const { priority_workflow: _omitted, ...missing } = COMPLETE;
  void _omitted;
  assert.equal(intakeComplete(missing), false);
  assert.equal(intakeComplete({ ...COMPLETE, business_name: "  " }), false);
});

test("buildTaskSeeds returns the seven Blue Trail tasks in order", () => {
  const seeds = buildTaskSeeds({ priorityWorkflow: null, targetKpis: null });
  assert.equal(seeds.length, 7);
  assert.deepEqual(
    seeds.map((s) => s.task_type),
    ["website", "ecommerce", "social", "workflow", "ai_support", "inventory", "kpi_dashboard"],
  );
  assert.deepEqual(seeds.map((s) => s.sort_order), [0, 1, 2, 3, 4, 5, 6]);
});

test("buildTaskSeeds prefills the workflow and KPI tasks from the brief", () => {
  const seeds = buildTaskSeeds({
    priorityWorkflow: "Wholesale order intake",
    targetKpis: "Orders, repeat rate",
  });
  const workflow = seeds.find((s) => s.task_type === "workflow");
  const kpi = seeds.find((s) => s.task_type === "kpi_dashboard");
  assert.match(workflow!.notes ?? "", /Wholesale order intake/);
  assert.match(kpi!.notes ?? "", /Orders, repeat rate/);
  // Other tasks have no prefilled notes.
  assert.equal(seeds.find((s) => s.task_type === "website")!.notes, null);
});

test("backstopFeasibilityFlags catches out-of-scope signals and is clean otherwise", () => {
  const flagged = backstopFeasibilityFlags({
    priority_workflow: "Sync orders to our Salesforce via a custom integration",
  });
  assert.ok(flagged.length >= 1);
  assert.ok(flagged.every((f) => !f.includes("—")), "no em dashes in flags");

  const clean = backstopFeasibilityFlags({
    priority_workflow: "Taking phone orders and writing them down",
  });
  assert.equal(clean.length, 0);
});

test("mergeFeasibilityFlags de-duplicates case-insensitively, preserving order", () => {
  const merged = mergeFeasibilityFlags(
    ["Needs a mobile app", "Custom ERP sync"],
    ["custom erp sync", "Wholesale B2B portal"],
  );
  assert.deepEqual(merged, ["Needs a mobile app", "Custom ERP sync", "Wholesale B2B portal"]);
});
