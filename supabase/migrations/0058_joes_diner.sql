-- Welcome to Joe's: hosting, seating, and serving for Joe's Diner.
-- First build. See docs/clients/joes-diner/build-plan.md.
--
-- Access:
--   Nobody reads or writes these tables directly from a browser. Every screen
--   is a paired tablet that talks to the app's server routes, which use the
--   service role after checking the tablet's device token. RLS is enabled
--   with no policies, so the anon and authenticated roles see nothing, and no
--   other client app in this shared database can read Joe's data.
--
--   Every change to the floor goes through jd_commit, which saves the new
--   state and its events in one transaction and rejects stale writes, so the
--   floor and its history always agree. jd_events is append-only.
--
-- The "shared basics" (seats, staff, shifts, visits, tickets) are named for
-- the diner, not this module, so later modules (ordering, financials,
-- supply) build on them directly.

-- ---------------------------------------------------------------- settings

create table if not exists public.jd_settings (
  id boolean primary key default true check (id),
  hold_seconds integer not null default 60 check (hold_seconds between 15 and 600),
  protect_large_tables boolean not null default true,
  turn_small_minutes integer not null default 35 check (turn_small_minutes between 5 and 240),
  turn_medium_minutes integer not null default 45 check (turn_medium_minutes between 5 and 240),
  turn_large_minutes integer not null default 55 check (turn_large_minutes between 5 and 240),
  reset_minutes integer not null default 5 check (reset_minutes between 0 and 60),
  menu_url text not null default '',
  review_url text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.jd_settings enable row level security;
insert into public.jd_settings (id) values (true) on conflict do nothing;

-- ------------------------------------------------------------------- seats

create table if not exists public.jd_seats (
  code text primary key check (code ~ '^([0-9]{3}|bar[0-9]{1,2})$'),
  kind text not null check (kind in ('table', 'bar')),
  capacity integer not null check (capacity between 1 and 20),
  position integer not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.jd_seats enable row level security;

-- Tables 101 to 110 (mostly 4-person booths; 105 and 110 seat 7 until the
-- real counts come in) and bar1 to bar9.
insert into public.jd_seats (code, kind, capacity, position)
select n::text, 'table', case when n in (105, 110) then 7 else 4 end, n - 100
from generate_series(101, 110) as n
on conflict (code) do nothing;
insert into public.jd_seats (code, kind, capacity, position)
select 'bar' || n, 'bar', 1, n
from generate_series(1, 9) as n
on conflict (code) do nothing;

-- ------------------------------------------------------------------- staff

create table if not exists public.jd_staff (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  role text not null default 'server' check (role in ('server', 'cook', 'manager')),
  -- sha256 of (id || ':' || 4-digit code). Codes record who did what; they
  -- are not a security boundary.
  code_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.jd_staff enable row level security;

-- ----------------------------------------------------------------- devices

create table if not exists public.jd_devices (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 40),
  role text not null check (role in ('checkin', 'staff', 'table', 'kitchen', 'bell')),
  seat_code text references public.jd_seats (code),
  -- sha256 of the token stored in the tablet's cookie.
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  check ((role = 'table') = (seat_code is not null))
);
alter table public.jd_devices enable row level security;

-- ------------------------------------------------------------------ shifts

create table if not exists public.jd_shifts (
  id uuid primary key default gen_random_uuid(),
  business_date date not null unique,
  opened_at timestamptz,
  closed_at timestamptz,
  -- Increments on every commit; jd_commit rejects stale writes.
  version integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.jd_shifts enable row level security;

create table if not exists public.jd_shift_servers (
  shift_id uuid not null references public.jd_shifts (id) on delete cascade,
  staff_id uuid not null references public.jd_staff (id),
  name text not null,
  joined_at timestamptz not null,
  left_at timestamptz,
  -- The virtual starting number for someone who joins mid-shift. Fairness only.
  start_offset integer not null default 0,
  -- Guests actually seated with this server. Reports use this.
  actual_guests integer not null default 0,
  paused boolean not null default false,
  last_seated_at timestamptz,
  primary key (shift_id, staff_id)
);
alter table public.jd_shift_servers enable row level security;

-- ------------------------------------------------------------------ visits

create table if not exists public.jd_visits (
  id uuid primary key,
  shift_id uuid not null references public.jd_shifts (id) on delete cascade,
  -- The guest's private status link. Never shown on shared screens.
  token text not null unique check (char_length(token) >= 16),
  name text not null check (char_length(name) between 1 and 40),
  party_size integer not null check (party_size between 1 and 30),
  seating_choice text not null check (seating_choice in ('table', 'bar_ok', 'any')),
  source text not null check (source in ('counter', 'qr', 'staff')),
  phone text,
  text_consent boolean not null default false,
  status text not null check (status in ('waiting', 'called', 'seated', 'left', 'done', 'no_show', 'left_list')),
  all_here boolean not null default true,
  checked_in_at timestamptz not null,
  queue_at double precision not null,
  quoted_minutes integer,
  called_at timestamptz,
  seated_at timestamptz,
  server_id uuid references public.jd_staff (id),
  server_override boolean not null default false,
  first_food_ready_at timestamptz,
  guests_left_at timestamptz,
  table_ready_at timestamptz,
  ready_by uuid references public.jd_staff (id),
  ended_at timestamptz
);
alter table public.jd_visits enable row level security;
create index if not exists jd_visits_shift_idx on public.jd_visits (shift_id);
create index if not exists jd_visits_history_idx on public.jd_visits (table_ready_at) where table_ready_at is not null;

create table if not exists public.jd_visit_seats (
  visit_id uuid not null references public.jd_visits (id) on delete cascade,
  seat_code text not null references public.jd_seats (code),
  primary key (visit_id, seat_code)
);
alter table public.jd_visit_seats enable row level security;

create table if not exists public.jd_tickets (
  id uuid primary key,
  visit_id uuid not null references public.jd_visits (id) on delete cascade,
  seat_code text not null references public.jd_seats (code),
  ready_at timestamptz not null,
  picked_up_at timestamptz
);
alter table public.jd_tickets enable row level security;
create index if not exists jd_tickets_visit_idx on public.jd_tickets (visit_id);

-- ------------------------------------------------------------------ events

create table if not exists public.jd_events (
  id bigint generated always as identity primary key,
  shift_id uuid not null references public.jd_shifts (id),
  type text not null,
  occurred_at timestamptz not null,
  visit_id uuid references public.jd_visits (id),
  seat_codes text[] not null default '{}',
  staff_id uuid references public.jd_staff (id),
  device_id uuid references public.jd_devices (id),
  data jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);
alter table public.jd_events enable row level security;
create index if not exists jd_events_shift_idx on public.jd_events (shift_id, occurred_at);
create index if not exists jd_events_type_idx on public.jd_events (type, occurred_at);

create or replace function public.jd_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'jd_events is append-only; record a correcting event instead';
end;
$$;

drop trigger if exists jd_events_no_change on public.jd_events;
create trigger jd_events_no_change
  before update or delete on public.jd_events
  for each row execute function public.jd_events_append_only();

-- ------------------------------------------------------------------ commit

-- Saves one change to the floor: the rows that changed and the events that
-- describe it, in one transaction. p_expected is the shift version the
-- change was computed from; if another tablet committed first, this raises
-- 'jd_conflict' and the app recomputes from the new state.
create or replace function public.jd_commit(
  p_shift uuid,
  p_expected integer,
  p_shift_row jsonb,
  p_servers jsonb,
  p_visits jsonb,
  p_tickets jsonb,
  p_events jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_version integer;
  v jsonb;
begin
  select version into current_version from jd_shifts where id = p_shift for update;
  if current_version is null then
    raise exception 'jd_no_shift';
  end if;
  if current_version <> p_expected then
    raise exception 'jd_conflict';
  end if;

  update jd_shifts
     set opened_at = (p_shift_row ->> 'opened_at')::timestamptz,
         closed_at = (p_shift_row ->> 'closed_at')::timestamptz,
         version = current_version + 1
   where id = p_shift;

  insert into jd_shift_servers as s (
    shift_id, staff_id, name, joined_at, left_at, start_offset, actual_guests, paused, last_seated_at
  )
  select p_shift, x.staff_id, x.name, x.joined_at, x.left_at, x.start_offset, x.actual_guests, x.paused, x.last_seated_at
    from jsonb_to_recordset(coalesce(p_servers, '[]'::jsonb)) as x (
      staff_id uuid, name text, joined_at timestamptz, left_at timestamptz, start_offset integer,
      actual_guests integer, paused boolean, last_seated_at timestamptz
    )
  on conflict (shift_id, staff_id) do update
    set name = excluded.name, joined_at = excluded.joined_at, left_at = excluded.left_at,
        start_offset = excluded.start_offset, actual_guests = excluded.actual_guests,
        paused = excluded.paused, last_seated_at = excluded.last_seated_at;

  for v in select * from jsonb_array_elements(coalesce(p_visits, '[]'::jsonb)) loop
    insert into jd_visits (
      id, shift_id, token, name, party_size, seating_choice, source, phone, text_consent, status,
      all_here, checked_in_at, queue_at, quoted_minutes, called_at, seated_at, server_id,
      server_override, first_food_ready_at, guests_left_at, table_ready_at, ready_by, ended_at
    ) values (
      (v ->> 'id')::uuid, p_shift, v ->> 'token', v ->> 'name', (v ->> 'party_size')::integer,
      v ->> 'seating_choice', v ->> 'source', v ->> 'phone', (v ->> 'text_consent')::boolean,
      v ->> 'status', (v ->> 'all_here')::boolean, (v ->> 'checked_in_at')::timestamptz,
      (v ->> 'queue_at')::double precision, (v ->> 'quoted_minutes')::integer,
      (v ->> 'called_at')::timestamptz, (v ->> 'seated_at')::timestamptz, (v ->> 'server_id')::uuid,
      (v ->> 'server_override')::boolean, (v ->> 'first_food_ready_at')::timestamptz,
      (v ->> 'guests_left_at')::timestamptz, (v ->> 'table_ready_at')::timestamptz,
      (v ->> 'ready_by')::uuid, (v ->> 'ended_at')::timestamptz
    )
    on conflict (id) do update set
      name = excluded.name, party_size = excluded.party_size, seating_choice = excluded.seating_choice,
      phone = excluded.phone, text_consent = excluded.text_consent, status = excluded.status,
      all_here = excluded.all_here, queue_at = excluded.queue_at, quoted_minutes = excluded.quoted_minutes,
      called_at = excluded.called_at, seated_at = excluded.seated_at, server_id = excluded.server_id,
      server_override = excluded.server_override, first_food_ready_at = excluded.first_food_ready_at,
      guests_left_at = excluded.guests_left_at, table_ready_at = excluded.table_ready_at,
      ready_by = excluded.ready_by, ended_at = excluded.ended_at;

    delete from jd_visit_seats where visit_id = (v ->> 'id')::uuid;
    insert into jd_visit_seats (visit_id, seat_code)
    select (v ->> 'id')::uuid, code
      from jsonb_array_elements_text(coalesce(v -> 'seat_codes', '[]'::jsonb)) as code;
  end loop;

  insert into jd_tickets as t (id, visit_id, seat_code, ready_at, picked_up_at)
  select x.id, x.visit_id, x.seat_code, x.ready_at, x.picked_up_at
    from jsonb_to_recordset(coalesce(p_tickets, '[]'::jsonb)) as x (
      id uuid, visit_id uuid, seat_code text, ready_at timestamptz, picked_up_at timestamptz
    )
  on conflict (id) do update set picked_up_at = excluded.picked_up_at;

  insert into jd_events (shift_id, type, occurred_at, visit_id, seat_codes, staff_id, device_id, data)
  select p_shift, x.type, x.occurred_at, x.visit_id, coalesce(x.seat_codes, '{}'), x.staff_id, x.device_id,
         coalesce(x.data, '{}'::jsonb)
    from jsonb_to_recordset(coalesce(p_events, '[]'::jsonb)) as x (
      type text, occurred_at timestamptz, visit_id uuid, seat_codes text[], staff_id uuid,
      device_id uuid, data jsonb
    );

  return current_version + 1;
end;
$$;

revoke all on function public.jd_commit(uuid, integer, jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.jd_commit(uuid, integer, jsonb, jsonb, jsonb, jsonb, jsonb) to service_role;
