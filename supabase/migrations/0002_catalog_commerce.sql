-- Sprint 2 commerce: catalog of offerings, Stripe linkage, term consent, and a
-- webhook idempotency ledger. RLS keeps the catalog publicly readable (it is the
-- storefront offering list) while all writes flow through the service role.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type catalog_type as enum ('plan', 'alacarte');
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_type as enum ('recurring', 'one_time');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- catalog
-- ---------------------------------------------------------------------------
create table if not exists catalog (
  id uuid primary key default gen_random_uuid(),
  catalog_key text unique not null,
  name text not null,
  description text,
  type catalog_type not null,
  billing billing_type not null,
  unit_amount integer not null,            -- cents
  currency text not null default 'usd',
  interval text,                            -- 'month' for plans + maintenance, else null
  min_term_months integer,                  -- 12 for plans, else null
  requires_maintenance boolean not null default false,
  maintenance_key text,                     -- references another catalog_key
  stripe_product_id text,
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on catalog;
create trigger set_updated_at before update on catalog
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed (spec section 3). Idempotent: existing keys are left untouched so a
-- re-run never clobbers Stripe ids written back by the seed script.
-- ---------------------------------------------------------------------------
insert into catalog
  (catalog_key, name, description, type, billing, unit_amount, currency, interval, min_term_months, requires_maintenance, maintenance_key)
values
  ('green',        'Green Trail',  'Website refresh, basic ecommerce, social setup plus 1 daily AI post.', 'plan', 'recurring', 19900, 'usd', 'month', 12, false, null),
  ('blue',         'Blue Trail',   'Adds workflow automation, AI customer support, inventory, and a KPI dashboard.', 'plan', 'recurring', 49900, 'usd', 'month', 12, false, null),
  ('black',        'Black Trail',  'Adds monthly custom content by Double Blaze plus promo and product updates.', 'plan', 'recurring', 99900, 'usd', 'month', 12, false, null),
  ('double_black', 'Double Black', 'Adds monthly video reels, a training platform, and third-party app integrations.', 'plan', 'recurring', 149900, 'usd', 'month', 12, false, null),
  ('site_client',  'Commerce site, your content',  'A complete ecommerce site built around content you provide.', 'alacarte', 'one_time', 150000, 'usd', null, null, true, 'maintenance'),
  ('site_db',      'Commerce site, our content',   'A complete ecommerce site with content produced by Double Blaze.', 'alacarte', 'one_time', 450000, 'usd', null, null, true, 'maintenance'),
  ('workflow',     'Workflow automation', 'One automated workflow that removes a manual step. Priced per workflow, client hosted.', 'alacarte', 'one_time', 150000, 'usd', null, null, false, null),
  ('dashboard',    'Business dashboard',  'A live dashboard tracking up to 15 metrics. Client hosted.', 'alacarte', 'one_time', 250000, 'usd', null, null, false, null),
  ('maintenance',  'Maintenance',         'Ongoing hosting and upkeep attached to an a-la-carte build.', 'alacarte', 'recurring', 2900, 'usd', 'month', null, false, null)
on conflict (catalog_key) do nothing;

-- ---------------------------------------------------------------------------
-- Commerce columns on subscriptions / orders
-- ---------------------------------------------------------------------------
alter table subscriptions
  add column if not exists catalog_key text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists term_consent jsonb;

alter table orders
  add column if not exists catalog_key text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists term_consent jsonb;

create unique index if not exists subscriptions_checkout_session_uidx
  on subscriptions(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create unique index if not exists orders_checkout_session_uidx
  on orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index if not exists subscriptions_stripe_sub_idx on subscriptions(stripe_subscription_id);

-- ---------------------------------------------------------------------------
-- Webhook idempotency ledger (dedupe on Stripe event id)
-- ---------------------------------------------------------------------------
create table if not exists stripe_events (
  id text primary key,            -- Stripe event id (evt_...)
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table catalog enable row level security;
alter table stripe_events enable row level security;

-- Catalog: anyone may read active offerings; staff manage; service role bypasses.
drop policy if exists catalog_public_read on catalog;
create policy catalog_public_read on catalog
  for select using (active = true);
drop policy if exists catalog_staff_all on catalog;
create policy catalog_staff_all on catalog
  for all using (is_staff()) with check (is_staff());

-- stripe_events: no public access. Staff may read; the webhook uses the service
-- role (which bypasses RLS). No anon policy means anon/authenticated see nothing.
drop policy if exists stripe_events_staff_read on stripe_events;
create policy stripe_events_staff_read on stripe_events
  for select using (is_staff());
