-- Multi-region support. Regions are data-driven: a region row carries its
-- public copy (name, intro, cities served, local phone), its operational lead
-- (the assigned 1099 project_lead), and its readiness state. A region is only
-- shown publicly when active=true; only status='active' regions are indexable
-- and linkable. coming_soon regions render an interest-capture form instead.
--
-- The public storefront still builds and renders with zero secrets: the static
-- seed in src/lib/regions.ts mirrors this table and is the fallback when
-- Supabase is not configured. This table is the source of truth once it is.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type region_status as enum ('active', 'coming_soon');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- regions
-- ---------------------------------------------------------------------------
create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  status region_status not null default 'coming_soon',
  -- The assigned 1099 agent (a project_lead). Null => routes to the central
  -- inbox until a lead is onboarded. Used to assign projects and scope portals.
  lead_user_id uuid references users(id) on delete set null,
  local_phone text,
  intro_blurb text,
  cities_served text[] not null default '{}',
  -- Master enable flag. active=false hides the region entirely (not even a
  -- coming_soon page). active=true + status drives public visibility.
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists regions_status_idx on regions(status);
create index if not exists regions_lead_idx on regions(lead_user_id);

drop trigger if exists set_updated_at on regions;
create trigger set_updated_at before update on regions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- region_interests: coming_soon waitlist capture (emails the lead / central
-- inbox and stores the interest).
-- ---------------------------------------------------------------------------
create table if not exists region_interests (
  id uuid primary key default gen_random_uuid(),
  region_slug text not null,
  name text,
  email text not null,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists region_interests_slug_idx on region_interests(region_slug);

drop trigger if exists set_updated_at on region_interests;
create trigger set_updated_at before update on region_interests
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- organizations.region already exists (migration 0001) and stores the region
-- slug an org was acquired through. Document the linkage and index it for the
-- lead-scoped portal queries.
-- ---------------------------------------------------------------------------
comment on column organizations.region is
  'Region slug (regions.slug) the organization was acquired through; drives lead assignment and portal scoping.';
create index if not exists organizations_region_idx on organizations(region);

-- ---------------------------------------------------------------------------
-- Seed the four regions. Only the home region (New River & Roanoke Valleys)
-- starts active; the rest are coming_soon until a lead is onboarded and
-- delivery is confirmed (see docs/REGIONS.md). Idempotent: existing slugs are
-- left untouched so a re-run never clobbers a lead assignment or a flipped
-- status.
-- ---------------------------------------------------------------------------
insert into regions (slug, name, status, local_phone, intro_blurb, cities_served, active)
values
  (
    'new-river-roanoke',
    'New River & Roanoke Valleys',
    'active',
    null,
    'Our home region. Enterprise-grade technology, built right here at home, by neighbors invested in the valley''s success.',
    array['Blacksburg','Christiansburg','Radford','Salem','Roanoke','Martinsville','Danville'],
    true
  ),
  (
    'central-texas',
    'Central Texas',
    'coming_soon',
    null,
    'Double Blaze is expanding to Central Texas. Same enterprise-grade work, delivered by a local lead who knows the area.',
    array['Austin','Round Rock','Georgetown','San Marcos','Temple','Waco'],
    true
  ),
  (
    'south-texas',
    'South Texas',
    'coming_soon',
    null,
    'Double Blaze is coming to South Texas. Local delivery, national-brand depth, veteran-owned.',
    array['San Antonio','Corpus Christi','Laredo','McAllen','Brownsville','Victoria'],
    true
  ),
  (
    'central-eastern-virginia',
    'Central and Eastern Virginia',
    'coming_soon',
    null,
    'Double Blaze is heading east across Virginia. Websites, apps, and digital solutions, delivered locally.',
    array['Richmond','Charlottesville','Williamsburg','Newport News','Norfolk','Virginia Beach','Chesapeake'],
    true
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table regions enable row level security;
alter table region_interests enable row level security;

-- regions: anyone may read enabled regions (active=true), so coming_soon pages
-- render publicly. Staff manage; the service role bypasses RLS.
drop policy if exists regions_public_read on regions;
create policy regions_public_read on regions
  for select using (active = true);
drop policy if exists regions_staff_all on regions;
create policy regions_staff_all on regions
  for all using (is_staff()) with check (is_staff());

-- region_interests: no public read (PII). Captured via the service role on the
-- server. Staff may read.
drop policy if exists region_interests_staff_read on region_interests;
create policy region_interests_staff_read on region_interests
  for select using (is_staff());
