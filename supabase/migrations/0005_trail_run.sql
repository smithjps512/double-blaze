-- Sprint T1: Trail Run offer and billing spine.
--
-- Trail Run is the first-month-free program (docs/trail-run-program-brief.md).
-- The customer provides a payment method at signup with no charge. We build the
-- solution, and a 30-day window starts the day it launches. If they do not
-- cancel, billing begins on day 31 at the selected tier (default Blue Trail)
-- and the 12-month term starts that day.
--
-- Design note: the lifecycle lives on a dedicated `trail_run_engagements` table
-- keyed to the organization, not on `subscriptions`. A canceled Stripe
-- subscription is terminal, so reactivation within the 90-day window spawns a
-- brand-new subscription. If the lifecycle dates lived on `subscriptions` they
-- would orphan on the dead row at the exact boundary the program crosses. The
-- engagement carries the lifecycle and points at the current subscription via
-- an FK that is null until the launch event (Sprint T3) creates the
-- subscription. Billing status stays on `subscriptions`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type trail_run_status as enum (
    'signup', 'building', 'launched', 'active_window',
    'converting', 'converted', 'canceled', 'reactivated'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- trail_run_engagements
--
-- One engagement per Trail Run signup. `subscription_id` is null through
-- signup and build; the Sprint T3 launch event creates the subscription on the
-- saved payment method and links it here. The cancellation, retention, and
-- reactivation columns are populated by Sprint T4 logic; they are created now
-- so the schema is complete.
-- ---------------------------------------------------------------------------
create table if not exists trail_run_engagements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  -- Current subscription, set at launch (T3) and replaced on reactivation (T4).
  subscription_id uuid references subscriptions(id) on delete set null,
  status trail_run_status not null default 'signup',
  -- Selected tier as a catalog_key (default blue). The trial-end charge bills
  -- this tier; tier-swap before the window ends updates it.
  selected_tier text not null default 'blue',
  -- Stripe linkage captured at signup via a SetupIntent (no charge yet).
  stripe_customer_id text,
  stripe_payment_method_id text,
  stripe_setup_intent_id text,
  -- Consent record (mirrors the existing 12-month consent capture) plus its
  -- timestamp, stored for chargeback and dispute protection.
  consent jsonb,
  consent_captured_at timestamptz,
  -- Lifecycle dates. launch_date sets Day 0; window_end_date is launch + 30.
  launch_date timestamptz,
  window_end_date timestamptz,
  -- T4 columns: cancellation sets retention_expires_at to cancellation + 90.
  cancellation_date timestamptz,
  retention_expires_at timestamptz,
  reactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trail_run_engagements_org_idx
  on trail_run_engagements(organization_id);
create index if not exists trail_run_engagements_status_idx
  on trail_run_engagements(status);
create index if not exists trail_run_engagements_subscription_idx
  on trail_run_engagements(subscription_id);
-- A Stripe SetupIntent maps to exactly one engagement (webhook idempotency).
create unique index if not exists trail_run_engagements_setup_intent_uidx
  on trail_run_engagements(stripe_setup_intent_id)
  where stripe_setup_intent_id is not null;

-- updated_at trigger, consistent with migration 0001.
drop trigger if exists set_updated_at on trail_run_engagements;
create trigger set_updated_at before update on trail_run_engagements
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: staff read/write everything; a client reads only its own org's
-- engagement. Writes flow through the service role (which bypasses RLS), so no
-- client write policy is granted here, consistent with subscriptions/orders.
-- ---------------------------------------------------------------------------
alter table trail_run_engagements enable row level security;

drop policy if exists trail_run_engagements_staff_all on trail_run_engagements;
create policy trail_run_engagements_staff_all on trail_run_engagements
  for all using (is_staff()) with check (is_staff());

drop policy if exists trail_run_engagements_client_read on trail_run_engagements;
create policy trail_run_engagements_client_read on trail_run_engagements
  for select using (organization_id = current_org_id());
