-- The customer site model: one row per site, whatever tier or runtime.
--
-- Trailhead has its own tables (0008) and keeps them. This is not a migration
-- of that program, it is the destination the upgrade path never had: today
-- /api/trailhead/upgrade sets a status and hands back a checkout URL, and the
-- content goes nowhere, because there was no paid site model to go to.
--
-- Four tables, all organization-scoped, following the is_staff() RLS pattern
-- from 0001.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  -- How a site is served, not how much it costs.
  --   static:  rendered HTML, no server behavior (Trailhead, brochure sites)
  --   managed: the same renderer plus opt-in capability modules
  --   bespoke: its own repo and deployment, for the rare genuine application
  create type site_runtime as enum ('static', 'managed', 'bespoke');
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_status as enum (
    'draft',
    'building',
    'preview',
    'published',
    'suspended',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_version_status as enum (
    'draft',
    'building',
    'preview',
    'published',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type domain_verification_status as enum (
    'pending',
    'verified',
    'failed'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. sites
-- ---------------------------------------------------------------------------

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete restrict,
  project_id uuid references projects(id) on delete set null,

  -- The doubleblaze.solutions label. Kept for the life of the site even after
  -- a custom domain is primary, because it stays a stable internal handle and
  -- redirects to the real domain rather than rotting.
  slug text not null,
  name text not null,

  runtime site_runtime not null default 'static',
  -- Commercial tier: trailhead, green, blue, black, double_black, custom.
  -- Text rather than an enum because the catalog is data (spec section 3) and
  -- pricing tiers change more often than serving models do.
  tier text not null default 'trailhead',
  status site_status not null default 'draft',

  -- Design tokens, so one change restyles every page.
  theme jsonb not null default '{}'::jsonb,
  -- Enabled capability modules and their config: members, forms, events, ...
  capabilities jsonb not null default '{}'::jsonb,

  -- What the world is currently served. Publishing is a pointer move, which
  -- is what makes rollback free. Nullable: a site exists before it publishes.
  live_version_id uuid,

  footer_credit boolean not null default true,

  -- Attribution. This is what turns "does Trailhead lead to paid engagements"
  -- from a story into a query, which was the reason for running the program.
  source_trailhead_site_id uuid references trailhead_sites(id) on delete set null,

  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sites_slug_uidx on sites(slug);
create index if not exists sites_org_idx on sites(organization_id);
create index if not exists sites_status_idx on sites(status);
create unique index if not exists sites_source_trailhead_uidx
  on sites(source_trailhead_site_id) where source_trailhead_site_id is not null;

drop trigger if exists set_updated_at on sites;
create trigger set_updated_at before update on sites
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. site_versions
-- ---------------------------------------------------------------------------

create table if not exists site_versions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  version_number integer not null,

  -- The system of record: structured blocks, not rendered HTML. The renderer
  -- owns markup so content stays editable, themeable, and safe to change.
  content jsonb not null default '{}'::jsonb,

  -- Where the rendered artifacts for this version live in storage, and their
  -- hashes. Serving reads these; it does not re-render and does not read
  -- `content` at all.
  built_manifest jsonb,

  status site_version_status not null default 'draft',
  notes text,
  created_by uuid references users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Version numbers are per site and never reused, so history stays readable.
create unique index if not exists site_versions_site_number_uidx
  on site_versions(site_id, version_number);
create index if not exists site_versions_site_created_idx
  on site_versions(site_id, created_at desc);

drop trigger if exists set_updated_at on site_versions;
create trigger set_updated_at before update on site_versions
  for each row execute function set_updated_at();

-- Deferred until site_versions exists, since the two tables reference each
-- other. Deleting a live version nulls the pointer rather than cascading:
-- losing the site record because someone removed a version would be worse
-- than briefly serving nothing.
do $$ begin
  alter table sites
    add constraint sites_live_version_fk
    foreign key (live_version_id) references site_versions(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 4. site_domains
-- ---------------------------------------------------------------------------

create table if not exists site_domains (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  hostname text not null,
  is_primary boolean not null default false,

  verification_status domain_verification_status not null default 'pending',
  -- The DNS records the customer must create, so the app can show them rather
  -- than sending someone to a dashboard to copy values by hand.
  verification_records jsonb not null default '[]'::jsonb,
  ssl_status text,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A hostname can only ever point at one site.
create unique index if not exists site_domains_hostname_uidx
  on site_domains(lower(hostname));
-- At most one primary per site. Canonical URLs depend on this being singular.
create unique index if not exists site_domains_one_primary_uidx
  on site_domains(site_id) where is_primary;

drop trigger if exists set_updated_at on site_domains;
create trigger set_updated_at before update on site_domains
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. site_assets
-- ---------------------------------------------------------------------------

create table if not exists site_assets (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  storage_path text not null,
  kind text not null default 'image'
    check (kind in ('image', 'audio', 'video', 'document', 'other')),
  mime_type text,
  original_filename text,

  -- Alt text lives with the asset rather than the block, so one description
  -- follows an image everywhere it is used.
  alt_text text,
  width integer,
  height integer,
  byte_size bigint,
  -- Content hash, so re-uploading the same file is detectable.
  checksum text,

  uploaded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_assets_path_uidx on site_assets(storage_path);
create index if not exists site_assets_site_idx on site_assets(site_id);
create index if not exists site_assets_site_kind_idx on site_assets(site_id, kind);

drop trigger if exists set_updated_at on site_assets;
create trigger set_updated_at before update on site_assets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
--
-- Staff get full access. Clients get read access scoped to their organization,
-- so the portal can show a client their own site without exposing anyone
-- else's. Public serving goes through the service role in the site runtime and
-- bypasses RLS, so there is no public policy here by design.

alter table sites enable row level security;
alter table site_versions enable row level security;
alter table site_domains enable row level security;
alter table site_assets enable row level security;

drop policy if exists sites_staff_all on sites;
create policy sites_staff_all on sites
  for all using (is_staff()) with check (is_staff());

drop policy if exists sites_client_read on sites;
create policy sites_client_read on sites
  for select using (organization_id = current_org_id());

drop policy if exists site_versions_staff_all on site_versions;
create policy site_versions_staff_all on site_versions
  for all using (is_staff()) with check (is_staff());

drop policy if exists site_versions_client_read on site_versions;
create policy site_versions_client_read on site_versions
  for select using (
    exists (
      select 1 from sites s
      where s.id = site_versions.site_id
        and s.organization_id = current_org_id()
    )
  );

drop policy if exists site_domains_staff_all on site_domains;
create policy site_domains_staff_all on site_domains
  for all using (is_staff()) with check (is_staff());

drop policy if exists site_domains_client_read on site_domains;
create policy site_domains_client_read on site_domains
  for select using (
    exists (
      select 1 from sites s
      where s.id = site_domains.site_id
        and s.organization_id = current_org_id()
    )
  );

drop policy if exists site_assets_staff_all on site_assets;
create policy site_assets_staff_all on site_assets
  for all using (is_staff()) with check (is_staff());

drop policy if exists site_assets_client_read on site_assets;
create policy site_assets_client_read on site_assets
  for select using (
    exists (
      select 1 from sites s
      where s.id = site_assets.site_id
        and s.organization_id = current_org_id()
    )
  );
