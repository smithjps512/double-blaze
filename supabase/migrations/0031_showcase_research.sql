-- Car pages a team researches, with the citation rule enforced in the database
-- as well as the code.
--
-- The teaching idea: a car page is not "type what you remember", it is find it
-- out and say where you found it. That rule only means something if it is a
-- rule. So the API refuses a save without a source, and the constraints below
-- refuse one too, because a rule that lives only in a form is a rule that lasts
-- until somebody opens the developer tools.

-- --------------------------------------------------------------------------
-- What a researched car page holds
-- --------------------------------------------------------------------------
--
-- Typed columns rather than a free-form blob. Each one is a question the team
-- has to go and answer, and a form with "Transmission" on it teaches the word;
-- a form with "add a field" does not.

alter table public.showcase_cars
  add column if not exists manufacturer text not null default '',
  add column if not exists production text not null default '',
  add column if not exists engine text not null default '',
  add column if not exists transmission text not null default '',
  add column if not exists drivetrain text not null default '',
  add column if not exists chassis text not null default '',
  add column if not exists suspension text not null default '',
  add column if not exists brakes text not null default '',
  -- The two long ones. Separate on purpose: the story of a car and the story of
  -- the company that built it are different research, and a team that has done
  -- one has usually not done the other.
  add column if not exists car_history text not null default '',
  add column if not exists maker_history text not null default '',
  -- Who the photograph belongs to, and where it came from.
  --
  -- Not optional once there is a photo. A picture somebody else took is the one
  -- thing on this site most likely to belong to a stranger, and "found it on
  -- Google" is not where a photo comes from.
  add column if not exists image_credit text not null default '',
  add column if not exists image_source_url text not null default '';

-- --------------------------------------------------------------------------
-- Sources
-- --------------------------------------------------------------------------

create table if not exists public.showcase_sources (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  car_id uuid not null references public.showcase_cars (id) on delete cascade,
  title text not null,
  url text not null,
  -- Which part of the page this backs up. Free text rather than an enum: they
  -- will cite things the field list never anticipated, and a source nobody can
  -- file is a source that does not get added.
  covers text not null default '',
  created_at timestamptz not null default now(),
  -- A title and a link, both of them actually there. An empty citation is worse
  -- than none, because it looks like the work was done.
  constraint showcase_sources_title_present check (length(btrim(title)) > 0),
  constraint showcase_sources_url_http check (url ~* '^https?://.+\..+')
);

create index if not exists showcase_sources_car_idx
  on public.showcase_sources (car_id, created_at);

alter table public.showcase_sources enable row level security;

-- Public read, like every other showcase table: the sources are part of the
-- page, and a reference list nobody can see is not a reference list. Writes go
-- through the service role after the passcode check, so there is deliberately
-- no insert, update or delete policy here.
drop policy if exists showcase_sources_public_read on public.showcase_sources;
create policy showcase_sources_public_read on public.showcase_sources for select using (true);

-- --------------------------------------------------------------------------
-- The rule, in the database
-- --------------------------------------------------------------------------
--
-- A photo has to carry its credit and where it came from. This one can be a
-- check constraint because both facts live in the same row.
--
-- "Every researched field needs a source" cannot be, because that spans two
-- tables and Postgres will not check across rows here. That half is enforced in
-- the API route, and this constraint is why the half that can be is.

alter table public.showcase_cars
  drop constraint if exists showcase_cars_photo_is_credited;

alter table public.showcase_cars
  add constraint showcase_cars_photo_is_credited check (
    image_path is null
    or (length(btrim(image_credit)) > 0 and image_source_url ~* '^https?://.+\..+')
  ) not valid;

-- `not valid` so the four seeded example cars, which have no photos, are not
-- retro-checked. Every new or edited row is checked from now on.
