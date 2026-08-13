-- Events (session 6).
--
-- The brief: any member schedules one, with a topic, a description, and a date
-- required, and a conferencing link and a physical location optional. Plus
-- invitations.
--
-- Two tables, the same shape as articles in 0023, because they are the same
-- kind of thing: member-authored content in a club, scoped by site, readable by
-- members, removable by administrators.
--
-- ---------------------------------------------------------------------------
-- The decision that matters here is time
-- ---------------------------------------------------------------------------
--
-- The membership is international. The brief says so, the directory already has
-- people in four countries, and this is the session where that stops being a
-- note and becomes a bug if it is got wrong.
--
-- An event is stored as **an instant plus the organiser's timezone**, not as a
-- wall clock reading:
--
--   starts_at   timestamptz  the actual moment, in UTC as Postgres stores it
--   timezone    text         the IANA zone the organiser was thinking in
--
-- The instant alone is not enough. A member in Malmo reading "20:00" has no way
-- to tell whether the organiser meant an evening session or an afternoon one
-- that happens to land in their evening, and that difference decides whether
-- they think the club is inconsiderate. So the zone is kept and shown, and the
-- application renders both: the time where the event is, and the time where the
-- reader is.
--
-- The wall clock alone would be worse, because it cannot be ordered or compared
-- across zones without knowing the offset on that date, which changes twice a
-- year in most of them.
--
-- The zone is not constrained here. Postgres can check a name against
-- pg_timezone_names, but a check constraint that consults a catalogue table is
-- a check constraint that changes meaning when the tzdata package updates. The
-- application validates it instead, in lib/events.ts, where it has a test.
--
-- ---------------------------------------------------------------------------
-- Attendance is attributable, and reading is not
-- ---------------------------------------------------------------------------
--
-- 0023 made reader counts a number and never a list, deliberately, because
-- nobody asked to know who read what and reading data has a retention problem.
--
-- Attendance is the opposite and the contrast is worth stating so the two are
-- not made consistent by somebody later. Knowing who is coming to a meeting is
-- most of the reason to go to it, the brief's "connect with members" is served
-- by exactly that, and an attendee list is a thing the attendees themselves
-- expect to be visible. So it is readable by any active member.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type site_event_status as enum (
    'scheduled',
    -- Cancelled, not deleted. People have it in their calendars, and the only
    -- thing worse than an event being called off is it silently vanishing.
    'cancelled',
    -- An administrator took it down, as with articles in 0023.
    'removed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_event_attendance as enum (
    -- The organiser asked this member directly. They have not answered yet.
    'invited',
    'going',
    'declined'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Events
-- ---------------------------------------------------------------------------

create table if not exists site_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  -- Any member schedules, per the brief. Cascade for the same reason as
  -- site_articles.author_id: sites cascade into site_members, so a restrict
  -- here would make deleting a club fail.
  organiser_id uuid not null references site_members(id) on delete cascade,

  status site_event_status not null default 'scheduled',

  slug text not null,
  -- The brief calls it a topic rather than a title, and the word is worth
  -- keeping: it is what the meeting is about, not what it is called.
  topic text not null,
  description text not null,

  starts_at timestamptz not null,
  ends_at timestamptz,
  -- The IANA zone the organiser scheduled in. See the note at the top.
  timezone text not null default 'UTC',

  -- Both optional, per the brief. An event may be online, in a room, or both.
  conferencing_url text,
  location text,

  cancelled_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references site_members(id) on delete set null,

  is_demo boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- An event that ends before it starts is a typo, and it is cheap to refuse
  -- here rather than to render.
  constraint site_events_ends_after_start check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists site_events_site_slug_uidx
  on site_events(site_id, lower(slug));

-- The query every member runs: what is coming up in my club.
create index if not exists site_events_upcoming_idx
  on site_events(site_id, starts_at) where status <> 'removed';

create index if not exists site_events_organiser_idx
  on site_events(organiser_id, starts_at desc);

create index if not exists site_events_demo_idx on site_events(site_id) where is_demo;

drop trigger if exists set_updated_at on site_events;
create trigger set_updated_at before update on site_events
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Attendance
-- ---------------------------------------------------------------------------
--
-- One row per member per event, carrying both halves of the brief's
-- "invitations": a row the organiser created saying "you are invited", and a
-- row the member created saying "I am coming". They are the same row because
-- they answer the same question, and keeping them apart would mean deciding
-- what an invitation that was accepted then declined looks like.

create table if not exists site_event_attendees (
  id uuid primary key default gen_random_uuid(),

  -- Denormalized from the event by the trigger below rather than trusted from
  -- the caller, so the tenant policy cannot be fooled by a row claiming the
  -- wrong club. Same reasoning as site_article_reads in 0023.
  site_id uuid not null references sites(id) on delete cascade,
  event_id uuid not null references site_events(id) on delete cascade,
  member_id uuid not null references site_members(id) on delete cascade,

  status site_event_attendance not null default 'invited',

  -- Who asked. Null when the member added themselves, which is the ordinary
  -- case: every member can see every event, so most attendance is unprompted.
  invited_by uuid references site_members(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_event_attendees_uidx
  on site_event_attendees(event_id, member_id);

create index if not exists site_event_attendees_member_idx
  on site_event_attendees(member_id, created_at desc);

drop trigger if exists set_updated_at on site_event_attendees;
create trigger set_updated_at before update on site_event_attendees
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Triggers
-- ---------------------------------------------------------------------------

-- Cancellation and removal stamp themselves, as publication does in 0023.
create or replace function app.stamp_site_event_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.cancelled_at := case when new.status = 'cancelled' then now() else null end;
    new.removed_at := null;
    new.removed_by := null;
    return new;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_at := now();
  elsif new.status <> 'cancelled' then
    new.cancelled_at := null;
  else
    new.cancelled_at := old.cancelled_at;
  end if;

  if new.status = 'removed' and old.status <> 'removed' then
    new.removed_at := now();
    new.removed_by := app.current_site_member_id(new.site_id);
  elsif new.status <> 'removed' then
    new.removed_at := null;
    new.removed_by := null;
  else
    new.removed_at := old.removed_at;
    new.removed_by := old.removed_by;
  end if;

  return new;
end;
$$;

drop trigger if exists stamp_status on site_events;
create trigger stamp_status before insert or update on site_events
  for each row execute function app.stamp_site_event_status();

-- What an organiser may not do to their own event. The same shape as
-- app.guard_site_article_author_update in 0023 and 0024.
create or replace function app.guard_site_event_organiser_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if is_staff() or app.is_site_admin(old.site_id) then
    return new;
  end if;

  if new.site_id is distinct from old.site_id
     or new.organiser_id is distinct from old.organiser_id
     or new.is_demo is distinct from old.is_demo then
    raise exception 'An event cannot change its organiser, its club, or whether it is demonstration content.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Removal is an administrator's decision. An organiser cancels instead, which
  -- is a different thing and stays visible.
  if old.status = 'removed' or new.status = 'removed' then
    raise exception 'Only an administrator removes or restores an event.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_organiser_update on site_events;
create trigger guard_organiser_update before update on site_events
  for each row execute function app.guard_site_event_organiser_update();

-- An attendance row belongs to the event's club, whatever the caller said.
create or replace function app.stamp_site_event_attendee()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_site uuid;
  v_status site_event_status;
begin
  if tg_op = 'INSERT' then
    select e.site_id, e.status into v_site, v_status
      from site_events e where e.id = new.event_id;

    -- No event, or one nobody should be joining.
    if v_site is null or v_status = 'removed' then
      return null;
    end if;

    new.site_id := v_site;
    return new;
  end if;

  new.site_id := old.site_id;
  new.event_id := old.event_id;
  new.member_id := old.member_id;
  return new;
end;
$$;

drop trigger if exists stamp_attendee on site_event_attendees;
create trigger stamp_attendee before insert or update on site_event_attendees
  for each row execute function app.stamp_site_event_attendee();

-- ---------------------------------------------------------------------------
-- 5. Row level security
-- ---------------------------------------------------------------------------

alter table site_events enable row level security;
alter table site_event_attendees enable row level security;

drop policy if exists site_events_staff_all on site_events;
create policy site_events_staff_all on site_events
  for all using (is_staff()) with check (is_staff());

-- Every active member sees every event in their own club, cancelled ones
-- included, because a cancellation is information rather than an absence. A
-- lapsed guest is not an active member, so the same answer applies as to the
-- library.
drop policy if exists site_events_member_read on site_events;
create policy site_events_member_read on site_events
  for select using (
    app.is_active_site_member(site_id)
    and status <> 'removed'
  );

-- An organiser always sees their own, including one an administrator removed.
drop policy if exists site_events_organiser_read on site_events;
create policy site_events_organiser_read on site_events
  for select using (organiser_id = app.current_site_member_id(site_id));

-- "Any member schedules", per the brief. No approval, for the same reason
-- articles publish immediately: members are vetted at the door.
drop policy if exists site_events_member_write on site_events;
create policy site_events_member_write on site_events
  for insert to authenticated
  with check (
    app.is_active_site_member(site_id)
    and organiser_id = app.current_site_member_id(site_id)
  );

drop policy if exists site_events_organiser_update on site_events;
create policy site_events_organiser_update on site_events
  for update to authenticated
  using (
    app.is_active_site_member(site_id)
    and organiser_id = app.current_site_member_id(site_id)
  )
  with check (
    app.is_active_site_member(site_id)
    and organiser_id = app.current_site_member_id(site_id)
  );

drop policy if exists site_events_organiser_delete on site_events;
create policy site_events_organiser_delete on site_events
  for delete to authenticated
  using (
    app.is_active_site_member(site_id)
    and organiser_id = app.current_site_member_id(site_id)
    and status <> 'removed'
  );

drop policy if exists site_events_admin_all on site_events;
create policy site_events_admin_all on site_events
  for all using (app.is_site_admin(site_id)) with check (app.is_site_admin(site_id));

-- Attendance -----------------------------------------------------------------

drop policy if exists site_event_attendees_staff_all on site_event_attendees;
create policy site_event_attendees_staff_all on site_event_attendees
  for all using (is_staff()) with check (is_staff());

-- Visible to the club, unlike reading data. See the note at the top: knowing
-- who is coming is most of the reason to come.
drop policy if exists site_event_attendees_member_read on site_event_attendees;
create policy site_event_attendees_member_read on site_event_attendees
  for select using (app.is_active_site_member(site_id));

-- A member answers for themselves.
drop policy if exists site_event_attendees_self_write on site_event_attendees;
create policy site_event_attendees_self_write on site_event_attendees
  for insert to authenticated
  with check (
    app.is_active_site_member(site_id)
    and member_id = app.current_site_member_id(site_id)
  );

drop policy if exists site_event_attendees_self_update on site_event_attendees;
create policy site_event_attendees_self_update on site_event_attendees
  for update to authenticated
  using (member_id = app.current_site_member_id(site_id))
  with check (member_id = app.current_site_member_id(site_id));

drop policy if exists site_event_attendees_self_delete on site_event_attendees;
create policy site_event_attendees_self_delete on site_event_attendees
  for delete to authenticated
  using (member_id = app.current_site_member_id(site_id));

-- An organiser invites somebody else to their own event, and may withdraw the
-- invitation. They cannot answer on that member's behalf, which is why this is
-- insert and delete rather than update.
drop policy if exists site_event_attendees_organiser_invite on site_event_attendees;
create policy site_event_attendees_organiser_invite on site_event_attendees
  for insert to authenticated
  with check (
    status = 'invited'
    and invited_by = app.current_site_member_id(site_id)
    and exists (
      select 1 from site_events e
      where e.id = event_id
        and e.organiser_id = app.current_site_member_id(e.site_id)
    )
  );

drop policy if exists site_event_attendees_organiser_delete on site_event_attendees;
create policy site_event_attendees_organiser_delete on site_event_attendees
  for delete to authenticated
  using (
    status = 'invited'
    and exists (
      select 1 from site_events e
      where e.id = event_id
        and e.organiser_id = app.current_site_member_id(e.site_id)
    )
  );

drop policy if exists site_event_attendees_admin_all on site_event_attendees;
create policy site_event_attendees_admin_all on site_event_attendees
  for all using (app.is_site_admin(site_id)) with check (app.is_site_admin(site_id));

-- ---------------------------------------------------------------------------
-- 6. The demo guard learns about events
-- ---------------------------------------------------------------------------
--
-- 0024 refuses to publish a site holding demonstration content, and purges it
-- in one call. Both counted members, articles, and series, because that was
-- everything there was. An event added now would survive the purge and would
-- not block publication, which is exactly the failure that guard exists to
-- prevent.
--
-- Worth knowing for session 7: anything added there needs the same two edits.

create or replace function app.guard_site_publish_without_demo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_members int;
  v_articles int;
  v_series int;
  v_events int;
begin
  if new.status <> 'published' or old.status = 'published' then
    return new;
  end if;

  select count(*) into v_members from site_members where site_id = new.id and is_demo;
  select count(*) into v_articles from site_articles where site_id = new.id and is_demo;
  select count(*) into v_series from site_article_series where site_id = new.id and is_demo;
  select count(*) into v_events from site_events where site_id = new.id and is_demo;

  if v_members + v_articles + v_series + v_events > 0 then
    raise exception
      'This site still holds demonstration content: % members, % articles, % series, % events. Run select app.purge_site_demo_rows(%L) before publishing.',
      v_members, v_articles, v_series, v_events, new.id
      using errcode = 'raise_exception';
  end if;

  return new;
end;
$$;

create or replace function app.purge_site_demo_rows(p_site_id uuid)
returns table (
  removed_articles int,
  removed_series int,
  removed_members int,
  removed_events int,
  orphaned_media text[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_media text[];
  v_articles int;
  v_series int;
  v_members int;
  v_events int;
begin
  select coalesce(array_agg(media_path), '{}')
    into v_media
    from site_articles
   where site_id = p_site_id and is_demo and media_path is not null;

  with gone as (
    delete from site_events where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_events from gone;

  with gone as (
    delete from site_articles where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_articles from gone;

  with gone as (
    delete from site_article_series where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_series from gone;

  with gone as (
    delete from site_members where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_members from gone;

  return query select v_articles, v_series, v_members, v_events, v_media;
end;
$$;

revoke execute on function app.purge_site_demo_rows(uuid) from public, anon, authenticated;

grant execute on function app.current_site_member_id(uuid) to authenticated;
grant execute on function app.is_active_site_member(uuid) to authenticated;
grant execute on function app.is_site_admin(uuid) to authenticated;
