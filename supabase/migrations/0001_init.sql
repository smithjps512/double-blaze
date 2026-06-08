-- Double Blaze core schema (spec section 4) with row-level security.
--
-- Identity comes from Clerk. With Supabase's third-party (Clerk) auth
-- integration, the request JWT carries the Clerk user id in the `sub` claim,
-- read here via auth.jwt(). Trusted server-side writes use the service role
-- (which bypasses RLS); these policies guard the authenticated/anon path so a
-- client can only ever see and touch its own organization's rows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('client', 'project_lead', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'refunded', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum (
    'new', 'account_setup', 'brief_ready', 'accepted', 'in_delivery', 'completed', 'canceled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type brief_status as enum ('draft', 'submitted_for_acceptance', 'accepted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deliverable_status as enum (
    'pending', 'in_progress', 'submitted', 'approved', 'changes_requested'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_decision as enum ('approved', 'changes_requested');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_channel as enum ('dashboard', 'email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meeting_type as enum ('kickoff', 'monthly_delivery', 'quarterly_review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meeting_status as enum ('proposed', 'scheduled', 'held', 'canceled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_contact_name text,
  primary_contact_email text,
  region text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text,
  full_name text,
  role user_role not null default 'client',
  is_staff boolean not null default false,
  organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists users_org_idx on users(organization_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan text not null,
  status subscription_status not null default 'incomplete',
  term_start timestamptz,
  min_term_end timestamptz,
  stripe_subscription_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_org_idx on subscriptions(organization_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  line_items jsonb not null default '[]'::jsonb,
  amount_total integer not null default 0, -- cents
  currency text not null default 'usd',
  status order_status not null default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_org_idx on orders(organization_id);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source_subscription_id uuid references subscriptions(id) on delete set null,
  source_order_id uuid references orders(id) on delete set null,
  status project_status not null default 'new',
  project_lead_id uuid references users(id) on delete set null,
  start_date date,
  target_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_org_idx on projects(organization_id);
create index if not exists projects_lead_idx on projects(project_lead_id);

create table if not exists intake_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  program_type text,
  transcript jsonb not null default '[]'::jsonb,
  captured_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists intake_sessions_project_idx on intake_sessions(project_id);

create table if not exists project_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  rendered_summary text,
  status brief_status not null default 'draft',
  accepted_by uuid references users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_briefs_project_idx on project_briefs(project_id);

create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status deliverable_status not null default 'pending',
  artifact_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deliverables_project_idx on deliverables(project_id);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  client_user_id uuid references users(id) on delete set null,
  decision approval_decision not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists approvals_deliverable_idx on approvals(deliverable_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  channel message_channel not null default 'dashboard',
  body text not null,
  related_event text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists messages_project_idx on messages(project_id);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null,
  actor_id uuid references users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_project_idx on events(project_id);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type meeting_type not null,
  scheduled_at timestamptz,
  status meeting_status not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists meetings_project_idx on meetings(project_id);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id);

-- updated_at triggers for every table
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','subscriptions','orders','projects','intake_sessions',
    'project_briefs','deliverables','approvals','messages','events','meetings','notifications'
  ] loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS helpers (read identity from the Clerk JWT)
-- ---------------------------------------------------------------------------
create or replace function current_clerk_id()
returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

create or replace function current_app_user_id()
returns uuid language sql stable as $$
  select id from users where clerk_user_id = current_clerk_id()
$$;

create or replace function current_org_id()
returns uuid language sql stable as $$
  select organization_id from users where clerk_user_id = current_clerk_id()
$$;

create or replace function is_staff()
returns boolean language sql stable as $$
  select coalesce(
    (select role in ('project_lead','admin') from users where clerk_user_id = current_clerk_id()),
    false
  )
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','users','subscriptions','orders','projects','intake_sessions',
    'project_briefs','deliverables','approvals','messages','events','meetings','notifications'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Staff (project_lead, admin) can read everything.
-- Clients are scoped to their own organization. Writes generally happen via the
-- service role on the server; client-facing write paths (approvals, messages)
-- get explicit policies in later sprints. Here we grant read access safely.

-- organizations
drop policy if exists org_staff_all on organizations;
create policy org_staff_all on organizations
  for all using (is_staff()) with check (is_staff());
drop policy if exists org_client_read on organizations;
create policy org_client_read on organizations
  for select using (id = current_org_id());

-- users
drop policy if exists users_staff_all on users;
create policy users_staff_all on users
  for all using (is_staff()) with check (is_staff());
drop policy if exists users_self_read on users;
create policy users_self_read on users
  for select using (clerk_user_id = current_clerk_id() or organization_id = current_org_id());

-- Helper to apply the standard org-scoped read + staff-all policy set.
do $$
declare t text;
begin
  foreach t in array array[
    'subscriptions','orders','projects'
  ] loop
    execute format('drop policy if exists %1$s_staff_all on %1$s', t);
    execute format(
      'create policy %1$s_staff_all on %1$s for all using (is_staff()) with check (is_staff())', t
    );
    execute format('drop policy if exists %1$s_client_read on %1$s', t);
    execute format(
      'create policy %1$s_client_read on %1$s for select using (organization_id = current_org_id())', t
    );
  end loop;
end $$;

-- Project-child tables are scoped through their project's organization.
do $$
declare t text;
begin
  foreach t in array array[
    'intake_sessions','project_briefs','deliverables','messages','events','meetings'
  ] loop
    execute format('drop policy if exists %1$s_staff_all on %1$s', t);
    execute format(
      'create policy %1$s_staff_all on %1$s for all using (is_staff()) with check (is_staff())', t
    );
    execute format('drop policy if exists %1$s_client_read on %1$s', t);
    execute format(
      'create policy %1$s_client_read on %1$s for select using (exists (select 1 from projects p where p.id = %1$s.project_id and p.organization_id = current_org_id()))', t
    );
  end loop;
end $$;

-- approvals are scoped through deliverable -> project -> org
drop policy if exists approvals_staff_all on approvals;
create policy approvals_staff_all on approvals
  for all using (is_staff()) with check (is_staff());
drop policy if exists approvals_client_read on approvals;
create policy approvals_client_read on approvals
  for select using (exists (
    select 1 from deliverables d
    join projects p on p.id = d.project_id
    where d.id = approvals.deliverable_id and p.organization_id = current_org_id()
  ));

-- notifications belong to a single user
drop policy if exists notifications_staff_all on notifications;
create policy notifications_staff_all on notifications
  for all using (is_staff()) with check (is_staff());
drop policy if exists notifications_self on notifications;
create policy notifications_self on notifications
  for all using (user_id = current_app_user_id())
  with check (user_id = current_app_user_id());
