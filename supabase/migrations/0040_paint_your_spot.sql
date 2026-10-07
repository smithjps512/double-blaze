-- BMS Paint Your Spot, Phase 1: the staff interest survey.
--
-- Served by apps/paint-your-spot at paintyourspot.doubleblaze.solutions.
-- Staff sign in with Google through Supabase Auth, limited to @mcps.org.
-- Every table carries the pys_ prefix so it sits apart from everything else
-- in this shared database.
--
-- Roles come from app config (ADMIN_EMAILS, BOSS_EMAILS). The server copies
-- them onto pys_profiles with the service role at sign in, and the policies
-- below read them from there. A user can never write their own profile, so a
-- user can never make themselves an admin.
--
-- The boss rule: anyone flagged is_boss never sees Paint the Boss data. In
-- Phase 1 that means a boss cannot pick the "chip into Paint the Boss" option
-- (stripped by trigger, not only hidden in the UI). Phase 3 tables must use
-- pys_is_boss() to deny reads the same way.
--
-- Planned for later phases (not created here):
--   pys_lots (id, name, photo_url)
--   pys_spots (lot_id, number, type standard|prime|boss|excluded, polygon jsonb,
--              owner_id, status open|claimed|paid|painted)
--   pys_claims, pys_designs
--   pys_boss_contributions, pys_boss_votes (never readable when pys_is_boss())

-- Profiles ------------------------------------------------------------------

create table if not exists public.pys_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text check (role in ('teacher', 'staff', 'admin', 'other')),
  is_admin boolean not null default false,
  is_boss boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pys_profiles enable row level security;

-- Security definer so policies can read flags without recursing into RLS.
create or replace function public.pys_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.pys_profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.pys_is_boss()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_boss from public.pys_profiles p where p.id = auth.uid()),
    false
  );
$$;

-- True only for a signed in user whose verified token says @mcps.org.
create or replace function public.pys_is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%@mcps.org', false);
$$;

drop policy if exists pys_profiles_read on public.pys_profiles;
create policy pys_profiles_read on public.pys_profiles
  for select to authenticated
  using (id = auth.uid() or public.pys_is_admin());

-- No insert or update policy: profiles are written by the server only.

-- Interest responses --------------------------------------------------------

create table if not exists public.pys_interest_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  name text not null check (char_length(name) between 1 and 120),
  role text not null check (role in ('teacher', 'staff', 'admin', 'other')),
  interest_level text not null check (interest_level in ('in', 'probably', 'curious')),
  interests text[] not null default '{}'
    check (interests <@ array['standard', 'prime', 'boss']::text[]),
  preferred_lot text not null check (preferred_lot in ('front', 'back', 'either')),
  painter text not null check (painter in ('self', 'art_student', 'unsure')),
  keep_yearly text not null check (keep_yearly in ('yes', 'no', 'maybe')),
  price_comfort text not null
    check (price_comfort in ('up_to_25', 'up_to_40', 'up_to_60', 'more_for_prime')),
  comments text check (comments is null or char_length(comments) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pys_interest_responses_level_idx
  on public.pys_interest_responses (interest_level);

alter table public.pys_interest_responses enable row level security;

drop policy if exists pys_responses_read on public.pys_interest_responses;
create policy pys_responses_read on public.pys_interest_responses
  for select to authenticated
  using (user_id = auth.uid() or public.pys_is_admin());

drop policy if exists pys_responses_insert on public.pys_interest_responses;
create policy pys_responses_insert on public.pys_interest_responses
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.pys_is_staff()
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

drop policy if exists pys_responses_update on public.pys_interest_responses;
create policy pys_responses_update on public.pys_interest_responses
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.pys_is_staff()
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Boss rule, enforced in the database. Also keeps timestamps honest.
create or replace function public.pys_responses_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.pys_is_boss() then
    new.interests := array_remove(new.interests, 'boss');
  end if;
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pys_responses_guard on public.pys_interest_responses;
create trigger pys_responses_guard
  before insert or update on public.pys_interest_responses
  for each row execute function public.pys_responses_guard();

-- Public count for the landing page meter: a number, never names.
-- "Interested" means I'm in or Probably. Just curious does not count.
create or replace function public.pys_interest_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.pys_interest_responses
  where interest_level in ('in', 'probably');
$$;

revoke all on function public.pys_interest_count() from public;
grant execute on function public.pys_interest_count() to anon, authenticated;

-- Settings ------------------------------------------------------------------

create table if not exists public.pys_settings (
  key text primary key check (key in (
    'standard_fee',
    'prime_fee',
    'boss_pot_goal',
    'interest_goal',
    'payment_link',
    'money_destination',
    'term_text'
  )),
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.pys_settings enable row level security;

-- Prices and goals are shown on the public landing page.
drop policy if exists pys_settings_read on public.pys_settings;
create policy pys_settings_read on public.pys_settings
  for select to anon, authenticated
  using (true);

drop policy if exists pys_settings_write on public.pys_settings;
create policy pys_settings_write on public.pys_settings
  for all to authenticated
  using (public.pys_is_admin())
  with check (public.pys_is_admin());

insert into public.pys_settings (key, value) values
  ('standard_fee', ''),
  ('prime_fee', ''),
  ('boss_pot_goal', '100'),
  ('interest_goal', '20'),
  ('payment_link', ''),
  ('money_destination', 'Staff events, meals, and celebrations'),
  ('term_text', '')
on conflict (key) do nothing;
