-- Trailhead: the free, tip-based rung below Green Trail.
--
-- New tables: trailhead_intakes, trailhead_sites, trailhead_tips,
-- trailhead_waitlist. Status enum for the site lifecycle. RLS: staff-only
-- on all tables; public writes go through service-role server routes only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Site status enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type trailhead_site_status as enum (
    'submitted',
    'awaiting_approval',
    'approved',
    'building',
    'preview',
    'published',
    'correcting',
    'exported',
    'upgraded',
    'declined',
    'waitlisted'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. trailhead_intakes: the intake form submission.
-- ---------------------------------------------------------------------------
create table if not exists trailhead_intakes (
  id uuid primary key default gen_random_uuid(),

  -- Section 0: site identity
  site_name text not null,
  subdomain text not null,
  site_type text not null check (site_type in ('marketing', 'member')),
  org_type text not null,
  org_type_other text,
  contact_email text not null,
  contact_name text not null,

  -- Section 1: plain-language pitch
  pitch text,
  audience text,
  primary_action text,
  primary_action_other text,
  differentiator text,

  -- Section 2: pages (max 5, validated in app)
  pages jsonb not null default '["home"]'::jsonb,

  -- Section 3: content you have
  logo_choice text,
  photos_choice text,
  copy_choice text,
  hours text,
  location text,
  social_links text,
  must_see text,

  -- Section 4: member/club specifics (null for marketing sites)
  member_join_method text,
  member_fee text,
  member_private_area text,
  member_roster text,

  -- Section 5: look and feel
  template text,
  colors text,
  inspiration_url text,
  tone text,

  -- Section 6: contact path
  contact_form_email text,
  show_phone boolean not null default false,
  phone text,
  show_address boolean not null default false,
  address text,

  -- Section 7: catch-all
  freetext_anything_else text,
  freetext_not_asked text,

  -- Internal (staff-only, never reaches client bundles)
  out_of_scope_flags jsonb not null default '[]'::jsonb,
  honeypot text,  -- hidden field, non-empty means spam

  status trailhead_site_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hard uniqueness on subdomain at database level.
create unique index if not exists trailhead_intakes_subdomain_uidx
  on trailhead_intakes(subdomain);

-- Month-scoped capacity queries.
create index if not exists trailhead_intakes_created_month_idx
  on trailhead_intakes(created_at);

drop trigger if exists set_updated_at on trailhead_intakes;
create trigger set_updated_at before update on trailhead_intakes
  for each row execute function set_updated_at();

alter table trailhead_intakes enable row level security;
drop policy if exists trailhead_intakes_staff_all on trailhead_intakes;
create policy trailhead_intakes_staff_all on trailhead_intakes
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- 3. trailhead_sites: the built site record.
-- ---------------------------------------------------------------------------
create table if not exists trailhead_sites (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null unique references trailhead_intakes(id) on delete cascade,
  subdomain text not null,
  status trailhead_site_status not null default 'submitted',
  template text,

  -- Content approval gate (stage 4): what the customer signed off on.
  approved_content jsonb,
  approval_timestamp timestamptz,

  -- The assembled site (HTML/CSS per-page for static export from the start).
  built_content jsonb,

  -- Preview and publish
  preview_token text,
  live_url text,

  -- Footer credit: removed on upgrade to any paid tier.
  footer_credit boolean not null default true,

  -- Internal
  staff_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trailhead_sites_subdomain_uidx
  on trailhead_sites(subdomain);

drop trigger if exists set_updated_at on trailhead_sites;
create trigger set_updated_at before update on trailhead_sites
  for each row execute function set_updated_at();

alter table trailhead_sites enable row level security;
drop policy if exists trailhead_sites_staff_all on trailhead_sites;
create policy trailhead_sites_staff_all on trailhead_sites
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- 4. trailhead_tips: Stripe one-time tips.
-- ---------------------------------------------------------------------------
create table if not exists trailhead_tips (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references trailhead_sites(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

alter table trailhead_tips enable row level security;
drop policy if exists trailhead_tips_staff_all on trailhead_tips;
create policy trailhead_tips_staff_all on trailhead_tips
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- 5. trailhead_waitlist: next-month signups when capacity is full.
-- ---------------------------------------------------------------------------
create table if not exists trailhead_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  target_month text not null,  -- YYYY-MM
  created_at timestamptz not null default now()
);

alter table trailhead_waitlist enable row level security;
drop policy if exists trailhead_waitlist_staff_all on trailhead_waitlist;
create policy trailhead_waitlist_staff_all on trailhead_waitlist
  for all using (is_staff()) with check (is_staff());
