-- Site members: the end users of a client's site.
--
-- This is a different population from the `users` table in 0001, and keeping
-- them apart is deliberate. `users` holds Double Blaze staff and the client
-- account holders who log into the portals: small, known, high privilege,
-- authenticated by Clerk. This table holds a club's own membership:
-- potentially thousands of people who belong to the client rather than to
-- Double Blaze, authenticated by Supabase Auth.
--
-- Putting them in one table would put a club's members in the same role
-- namespace and the same RLS predicates as staff. A member must never be able
-- to satisfy is_staff(), and a staff member is not automatically a member of
-- anyone's club. The two planes meet nowhere.
--
-- Multi-tenant from the first line. Every row is scoped by site_id and every
-- policy keys on it, so one deployment serves every association and adding a
-- club is an insert rather than a repository.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type site_member_role as enum (
    'member',
    -- A guest contributes for a bounded period: a meeting speaker, or an
    -- author publishing one piece for the membership to read.
    'guest',
    -- An officer moderates content but cannot admit or remove members.
    'officer',
    'admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_member_status as enum (
    -- Authenticated and applied, waiting on a human. Sees nothing yet.
    'pending',
    'active',
    'suspended',
    -- Kept rather than deleted so the same person reapplying is visible to an
    -- administrator, and so an accidental decline can be undone.
    'declined'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- 'public' exists for other clients on the platform. Electric Grid chose
  -- members_only, and nothing on their site will offer the public option.
  create type site_profile_visibility as enum ('hidden', 'members_only', 'public');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. site_members
-- ---------------------------------------------------------------------------

create table if not exists site_members (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  -- The Supabase Auth identity. Null only for an invitation that has been
  -- issued but not yet accepted, where no account exists yet.
  auth_user_id uuid references auth.users(id) on delete set null,

  -- Denormalized from the auth identity so an administrator can review and
  -- invite without a join into the auth schema, which RLS cannot reach.
  email text not null,
  display_name text,

  role site_member_role not null default 'member',
  status site_member_status not null default 'pending',

  -- What the applicant told us: employer, how their work connects to the grid
  -- or to AI. This is what an administrator reads to make a decision, and it
  -- is kept afterwards because a decision is only reviewable with its inputs.
  join_answers jsonb not null default '{}'::jsonb,

  -- A field map rather than columns, so per-field visibility ("show my
  -- employer, hide my phone") is a later change to one column rather than a
  -- migration.
  profile jsonb not null default '{}'::jsonb,
  profile_visibility site_profile_visibility not null default 'members_only',

  -- Guests only. A null expiry means access does not lapse.
  access_expires_at timestamptz,

  invited_by uuid references site_members(id) on delete set null,
  approved_by uuid references site_members(id) on delete set null,
  approved_at timestamptz,
  last_seen_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One membership per identity per site. The same person may belong to several
-- clubs on the platform, which is the point of scoping by site rather than
-- globally.
create unique index if not exists site_members_site_user_uidx
  on site_members(site_id, auth_user_id) where auth_user_id is not null;

-- One membership per email per site, so a second application does not create a
-- duplicate record for an administrator to reconcile.
create unique index if not exists site_members_site_email_uidx
  on site_members(site_id, lower(email));

-- The approval queue, which is the query an administrator runs most.
create index if not exists site_members_pending_idx
  on site_members(site_id, created_at) where status = 'pending';

create index if not exists site_members_directory_idx
  on site_members(site_id, status) where status = 'active';

create index if not exists site_members_expiring_idx
  on site_members(access_expires_at) where access_expires_at is not null;

drop trigger if exists set_updated_at on site_members;
create trigger set_updated_at before update on site_members
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. site_invitations
-- ---------------------------------------------------------------------------
--
-- An invited member joins without approval, per the brief. That makes the
-- invitation itself the credential, so only its hash is stored: a leaked
-- database backup should not hand someone a working invite. The raw token
-- exists only in the email that was sent.

create table if not exists site_invitations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  email text not null,
  role site_member_role not null default 'member',
  token_hash text not null,

  -- Guests are invited with an expiry for the access itself, separate from the
  -- expiry of the invitation to accept it.
  access_expires_at timestamptz,

  invited_by uuid references site_members(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_member_id uuid references site_members(id) on delete set null,
  revoked_at timestamptz,

  created_at timestamptz not null default now()
);

create unique index if not exists site_invitations_token_uidx on site_invitations(token_hash);
create index if not exists site_invitations_site_email_idx
  on site_invitations(site_id, lower(email));
create index if not exists site_invitations_open_idx
  on site_invitations(site_id, expires_at)
  where accepted_at is null and revoked_at is null;

-- ---------------------------------------------------------------------------
-- 4. Membership helpers
-- ---------------------------------------------------------------------------
--
-- SECURITY DEFINER so a policy can ask "is the caller a member of this site"
-- without the caller needing to read site_members directly, which would be
-- circular. search_path is pinned on each, because a mutable search_path on a
-- definer function is how a definer function becomes a privilege escalation.
--
-- They live in `app` rather than `public` because PostgREST exposes public
-- schema functions as REST endpoints, and a trigger function in particular has
-- no business being callable over HTTP. Policies still reach them by qualified
-- name.

create schema if not exists app;
grant usage on schema app to authenticated, anon, service_role;

create or replace function app.current_site_member_id(p_site_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id
  from site_members m
  where m.site_id = p_site_id
    and m.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function app.is_active_site_member(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from site_members m
    where m.site_id = p_site_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      -- A guest whose window has closed is not an active member, and the
      -- check lives here so no policy can forget it.
      and (m.access_expires_at is null or m.access_expires_at > now())
  )
$$;

create or replace function app.is_site_admin(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from site_members m
    where m.site_id = p_site_id
      and m.auth_user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'admin'
      and (m.access_expires_at is null or m.access_expires_at > now())
  )
$$;

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------

alter table site_members enable row level security;
alter table site_invitations enable row level security;

-- Double Blaze staff retain full access for support. This is the only bridge
-- between the two planes, and it runs one way.
drop policy if exists site_members_staff_all on site_members;
create policy site_members_staff_all on site_members
  for all using (is_staff()) with check (is_staff());

-- A member always sees their own row, whatever their status. A pending
-- applicant needs to see that they are pending.
drop policy if exists site_members_self_read on site_members;
create policy site_members_self_read on site_members
  for select using (auth_user_id = auth.uid());

-- A member edits their own profile. The columns they must not touch are
-- guarded by the trigger below, because a row-level policy cannot express
-- "these columns are off limits".
drop policy if exists site_members_self_update on site_members;
create policy site_members_self_update on site_members
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- The directory: active members see other active members of the same site who
-- have not hidden themselves. Hidden profiles are excluded here rather than in
-- the application, so a hidden member is absent from the result set entirely
-- rather than filtered out after the fact.
drop policy if exists site_members_directory_read on site_members;
create policy site_members_directory_read on site_members
  for select using (
    app.is_active_site_member(site_id)
    and status = 'active'
    and profile_visibility <> 'hidden'
  );

-- A club administrator manages their own site's membership, and only theirs.
drop policy if exists site_members_admin_all on site_members;
create policy site_members_admin_all on site_members
  for all using (app.is_site_admin(site_id)) with check (app.is_site_admin(site_id));

drop policy if exists site_invitations_staff_all on site_invitations;
create policy site_invitations_staff_all on site_invitations
  for all using (is_staff()) with check (is_staff());

-- Invitations are administrative. An invitee never reads this table: they
-- present a raw token to a server route, which looks up the hash with the
-- service role.
drop policy if exists site_invitations_admin_all on site_invitations;
create policy site_invitations_admin_all on site_invitations
  for all using (app.is_site_admin(site_id)) with check (app.is_site_admin(site_id));

-- ---------------------------------------------------------------------------
-- 6. Privilege guard
-- ---------------------------------------------------------------------------
--
-- site_members_self_update lets a member write their own row, which is what
-- profile editing needs. Without this trigger it would also let them set their
-- own role to admin or their own status to active, turning a pending applicant
-- into an administrator with one request. RLS cannot express column-level
-- limits, so the check lives here.

create or replace function app.guard_site_member_self_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Staff and site administrators legitimately change these fields.
  -- old.site_id, not new: the question is whether the caller may administer
  -- the row as it stands, not the site it is being moved to.
  if is_staff() or app.is_site_admin(old.site_id) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.site_id is distinct from old.site_id
     or new.auth_user_id is distinct from old.auth_user_id
     or new.email is distinct from old.email
     or new.access_expires_at is distinct from old.access_expires_at
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.invited_by is distinct from old.invited_by then
    raise exception 'A member may not change their own role, status, identity, or approval.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_self_update on site_members;
create trigger guard_self_update before update on site_members
  for each row execute function app.guard_site_member_self_update();

-- Policies evaluate as the querying role, so `authenticated` needs EXECUTE.
grant execute on function app.current_site_member_id(uuid) to authenticated;
grant execute on function app.is_active_site_member(uuid) to authenticated;
grant execute on function app.is_site_admin(uuid) to authenticated;
