/**
 * Idempotent Stripe seed. For every active row in the `catalog` table, ensure a
 * Stripe Product and Price exist (looked up by metadata.catalog_key), then write
 * the resulting ids back into the catalog. Safe to run in test and live, and
 * safe to re-run: existing products/prices are reused, never duplicated.
 *
 * Run:  STRIPE_SECRET_KEY=sk_test_... \
 *       NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *       npm run stripe:seed
 *
 * Prices are immutable in Stripe; if an amount/interval changes, a new price is
 * created and linked, and the old one is left inactive in Stripe for history.
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

interface CatalogRow {
  catalog_key: string;
  name: string;
  description: string | null;
  billing: "recurring" | "one_time";
  unit_amount: number;
  currency: string;
  interval: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const stripe = new Stripe(required("STRIPE_SECRET_KEY"));
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? required("SUPABASE_URL");
  const db = createClient(supabaseUrl, required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const mode = required("STRIPE_SECRET_KEY").startsWith("sk_live")
    ? "LIVE"
    : "TEST";
  console.log(`\nStripe seed (${mode} mode)\n${"=".repeat(28)}`);

  const { data, error } = await db
    .from("catalog")
    .select(
      "catalog_key,name,description,billing,unit_amount,currency,interval,stripe_product_id,stripe_price_id",
    )
    .eq("active", true);
  if (error) {
    console.error("Failed to read catalog:", error.message);
    process.exit(1);
  }
  const rows = (data as CatalogRow[]) ?? [];
  if (rows.length === 0) {
    console.warn("No active catalog rows found. Did you run migration 0002?");
    return;
  }

  for (const row of rows) {
    const product = await ensureProduct(stripe, row);
    const price = await ensurePrice(stripe, product.id, row);

    const { error: upErr } = await db
      .from("catalog")
      .update({ stripe_product_id: product.id, stripe_price_id: price.id })
      .eq("catalog_key", row.catalog_key);
    if (upErr) {
      console.error(`  ! ${row.catalog_key}: write-back failed: ${upErr.message}`);
      continue;
    }
    const amount = `$${(row.unit_amount / 100).toFixed(2)}${row.billing === "recurring" ? `/${row.interval}` : ""}`;
    console.log(
      `  ✓ ${row.catalog_key.padEnd(13)} ${amount.padEnd(12)} ${product.id} ${price.id}`,
    );
  }

  console.log("\nDone. Catalog updated with Stripe product and price ids.\n");
}

async function ensureProduct(
  stripe: Stripe,
  row: CatalogRow,
): Promise<Stripe.Product> {
  const found = await stripe.products.search({
    query: `metadata['catalog_key']:'${row.catalog_key}'`,
    limit: 1,
  });
  if (found.data[0]) {
    // Keep name/description in sync; products are mutable.
    return stripe.products.update(found.data[0].id, {
      name: row.name,
      description: row.description ?? undefined,
    });
  }
  return stripe.products.create({
    name: row.name,
    description: row.description ?? undefined,
    metadata: { catalog_key: row.catalog_key },
  });
}

async function ensurePrice(
  stripe: Stripe,
  productId: string,
  row: CatalogRow,
): Promise<Stripe.Price> {
  const found = await stripe.prices.search({
    query: `metadata['catalog_key']:'${row.catalog_key}'`,
    limit: 100,
  });
  const match = found.data.find(
    (p) =>
      p.active &&
      p.unit_amount === row.unit_amount &&
      p.currency === row.currency &&
      (row.billing === "recurring"
        ? p.recurring?.interval === row.interval
        : p.recurring === null),
  );
  if (match) return match;

  return stripe.prices.create({
    product: productId,
    unit_amount: row.unit_amount,
    currency: row.currency,
    tax_behavior: "exclusive",
    metadata: { catalog_key: row.catalog_key },
    ...(row.billing === "recurring"
      ? { recurring: { interval: (row.interval ?? "month") as Stripe.Price.Recurring.Interval } }
      : {}),
  });
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
