-- Find Me: shelter pet matching, adoption QR codes, and care plans.
-- Phase 1, the adoption core. See docs/clients/find-me/build-plan.md.
--
-- Roles:
--   anyone        reads active shelters and non-adopted animals
--   adopter       reads and writes only their own answers, favorites,
--                 inquiries, adoptions, and care tasks
--   shelter staff manage their own shelter's animals; read and update
--                 inquiries and adoption claims for their shelter only
--   admin         Double Blaze; manages shelters and staff
--
-- Profiles and staff rows are written by the server with the service role,
-- never by a user, so nobody can make themselves an admin or staff member.

-- ---------------------------------------------------------------- helpers

create table if not exists public.fm_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fm_profiles enable row level security;

create or replace function public.fm_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.fm_profiles p where p.id = auth.uid()), false);
$$;

-- --------------------------------------------------------------- shelters

create table if not exists public.fm_shelters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 120),
  city text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  -- Printed in the shelter's QR code. Uppercase so it reads well on a poster.
  adoption_code text not null unique check (adoption_code ~ '^[A-Z0-9]{4,24}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fm_shelters enable row level security;

create table if not exists public.fm_staff (
  user_id uuid not null references auth.users (id) on delete cascade,
  shelter_id uuid not null references public.fm_shelters (id) on delete cascade,
  role text not null default 'staff' check (role in ('staff', 'manager')),
  created_at timestamptz not null default now(),
  primary key (user_id, shelter_id)
);
alter table public.fm_staff enable row level security;

create or replace function public.fm_is_staff(shelter uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fm_staff s where s.user_id = auth.uid() and s.shelter_id = shelter
  ) or public.fm_is_admin();
$$;

-- ---------------------------------------------------------------- animals

create table if not exists public.fm_animals (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.fm_shelters (id) on delete cascade,
  species text not null check (species in ('dog', 'cat')),
  name text not null check (char_length(name) between 1 and 60),
  sex text not null check (sex in ('male', 'female')),
  age_group text not null check (age_group in ('baby', 'young', 'adult', 'senior')),
  age_label text not null default '' check (char_length(age_label) <= 40),
  size text not null check (size in ('small', 'medium', 'large', 'xlarge')),
  breed text not null default '' check (char_length(breed) <= 80),
  energy smallint not null default 2 check (energy between 1 and 3),
  coat_care smallint not null default 1 check (coat_care between 1 and 3),
  training_needs smallint not null default 1 check (training_needs between 1 and 3),
  good_with_kids text not null default 'unknown' check (good_with_kids in ('yes', 'no', 'unknown')),
  good_with_dogs text not null default 'unknown' check (good_with_dogs in ('yes', 'no', 'unknown')),
  good_with_cats text not null default 'unknown' check (good_with_cats in ('yes', 'no', 'unknown')),
  needs_yard boolean not null default false,
  alone_ok smallint not null default 2 check (alone_ok between 1 and 3),
  special_needs text not null default '' check (char_length(special_needs) <= 500),
  bio text not null default '' check (char_length(bio) <= 2000),
  photo_url text,
  fee integer check (fee is null or fee between 0 and 10000),
  status text not null default 'available' check (status in ('available', 'on_hold', 'adopted')),
  intake_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fm_animals_shelter on public.fm_animals (shelter_id, status);
create index if not exists fm_animals_listing on public.fm_animals (status, species, intake_date);
alter table public.fm_animals enable row level security;

-- ---------------------------------------------------------- adopter data

create table if not exists public.fm_adopter_answers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Keyed by question id (apps/find-me/src/lib/quiz.ts), so rewording a
  -- question never needs a migration.
  answers jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.fm_adopter_answers enable row level security;

create table if not exists public.fm_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  animal_id uuid not null references public.fm_animals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, animal_id)
);
alter table public.fm_favorites enable row level security;

create table if not exists public.fm_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  animal_id uuid not null references public.fm_animals (id) on delete cascade,
  shelter_id uuid not null references public.fm_shelters (id) on delete cascade,
  adopter_name text not null check (char_length(adopter_name) between 1 and 120),
  adopter_email text not null,
  message text not null default '' check (char_length(message) <= 2000),
  -- The adopter chooses whether the shelter sees their quiz answers.
  shared_answers jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, animal_id)
);
create index if not exists fm_inquiries_shelter on public.fm_inquiries (shelter_id, status, created_at desc);
alter table public.fm_inquiries enable row level security;

create table if not exists public.fm_adoptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  animal_id uuid not null references public.fm_animals (id) on delete cascade,
  shelter_id uuid not null references public.fm_shelters (id) on delete cascade,
  pet_name text not null check (char_length(pet_name) between 1 and 60),
  -- So staff know who is claiming. Checked against the sign-in email below.
  adopter_email text not null,
  claimed_at timestamptz not null default now(),
  status text not null default 'claimed' check (status in ('claimed', 'confirmed', 'rejected')),
  confirmed_by uuid references auth.users (id),
  confirmed_at timestamptz,
  unique (user_id, animal_id)
);
create index if not exists fm_adoptions_shelter on public.fm_adoptions (shelter_id, status, claimed_at desc);
alter table public.fm_adoptions enable row level security;

create table if not exists public.fm_care_tasks (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.fm_adoptions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  kind text not null,
  title text not null,
  details text not null default '',
  due_on date not null,
  repeat_days integer check (repeat_days is null or repeat_days > 0),
  enabled boolean not null default true,
  last_done_on date,
  -- The due date the last reminder email was for, so each due date is
  -- emailed once even though the cron runs daily. Written by the cron only.
  reminded_for date,
  created_at timestamptz not null default now(),
  unique (adoption_id, key)
);
create index if not exists fm_care_tasks_due on public.fm_care_tasks (enabled, due_on);
alter table public.fm_care_tasks enable row level security;

-- What a new owner can pick after scanning a shelter's QR code: that
-- shelter's animals that are listed, or were marked adopted in the last 30
-- days (staff often mark the adoption before the owner scans). Security
-- definer so recently adopted animals are visible here without being public.
create or replace function public.fm_claimable(animal uuid, shelter uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fm_animals an
    join public.fm_shelters s on s.id = an.shelter_id and s.active
    where an.id = animal and an.shelter_id = shelter
      and (an.status <> 'adopted' or an.updated_at > now() - interval '30 days')
  );
$$;

create or replace function public.fm_claimable_animals(code text)
returns table (id uuid, shelter_id uuid, name text, species text, age_group text, breed text, photo_url text)
language sql
stable
security definer
set search_path = public
as $$
  select an.id, an.shelter_id, an.name, an.species, an.age_group, an.breed, an.photo_url
  from public.fm_animals an
  join public.fm_shelters s on s.id = an.shelter_id and s.active
  where s.adoption_code = upper(code)
    and (an.status <> 'adopted' or an.updated_at > now() - interval '30 days')
  order by an.name;
$$;
grant execute on function public.fm_claimable_animals(text) to authenticated;

-- ---------------------------------------------------------------- policies

drop policy if exists fm_profiles_read on public.fm_profiles;
create policy fm_profiles_read on public.fm_profiles
  for select to authenticated using (id = auth.uid() or public.fm_is_admin());

drop policy if exists fm_shelters_read on public.fm_shelters;
create policy fm_shelters_read on public.fm_shelters
  for select to anon, authenticated using (active or public.fm_is_staff(id));
drop policy if exists fm_shelters_admin on public.fm_shelters;
create policy fm_shelters_admin on public.fm_shelters
  for all to authenticated using (public.fm_is_admin()) with check (public.fm_is_admin());
drop policy if exists fm_shelters_manager on public.fm_shelters;
create policy fm_shelters_manager on public.fm_shelters
  for update to authenticated using (public.fm_is_staff(id)) with check (public.fm_is_staff(id));

drop policy if exists fm_staff_read on public.fm_staff;
create policy fm_staff_read on public.fm_staff
  for select to authenticated using (user_id = auth.uid() or public.fm_is_admin());

-- Adopted animals stay readable by their own adopter (for the care plan
-- page) and by their shelter, but drop off the public listing.
drop policy if exists fm_animals_read on public.fm_animals;
create policy fm_animals_read on public.fm_animals
  for select to anon, authenticated using (
    (status <> 'adopted' and exists (select 1 from public.fm_shelters s where s.id = shelter_id and s.active))
    or public.fm_is_staff(shelter_id)
    or exists (select 1 from public.fm_adoptions a where a.animal_id = fm_animals.id and a.user_id = auth.uid())
  );
drop policy if exists fm_animals_write on public.fm_animals;
create policy fm_animals_write on public.fm_animals
  for all to authenticated using (public.fm_is_staff(shelter_id)) with check (public.fm_is_staff(shelter_id));

drop policy if exists fm_answers_own on public.fm_adopter_answers;
create policy fm_answers_own on public.fm_adopter_answers
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists fm_favorites_own on public.fm_favorites;
create policy fm_favorites_own on public.fm_favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists fm_inquiries_read on public.fm_inquiries;
create policy fm_inquiries_read on public.fm_inquiries
  for select to authenticated using (user_id = auth.uid() or public.fm_is_staff(shelter_id));
drop policy if exists fm_inquiries_insert on public.fm_inquiries;
create policy fm_inquiries_insert on public.fm_inquiries
  for insert to authenticated with check (
    user_id = auth.uid()
    and status = 'new'
    and lower(adopter_email) = lower(auth.jwt() ->> 'email')
    and exists (
      select 1 from public.fm_animals an
      where an.id = animal_id and an.shelter_id = fm_inquiries.shelter_id and an.status <> 'adopted'
    )
  );
drop policy if exists fm_inquiries_staff_update on public.fm_inquiries;
create policy fm_inquiries_staff_update on public.fm_inquiries
  for update to authenticated using (public.fm_is_staff(shelter_id)) with check (public.fm_is_staff(shelter_id));

drop policy if exists fm_adoptions_read on public.fm_adoptions;
create policy fm_adoptions_read on public.fm_adoptions
  for select to authenticated using (user_id = auth.uid() or public.fm_is_staff(shelter_id));
drop policy if exists fm_adoptions_claim on public.fm_adoptions;
create policy fm_adoptions_claim on public.fm_adoptions
  for insert to authenticated with check (
    user_id = auth.uid()
    and status = 'claimed'
    and confirmed_by is null
    and lower(adopter_email) = lower(auth.jwt() ->> 'email')
    and public.fm_claimable(animal_id, shelter_id)
  );
drop policy if exists fm_adoptions_staff_update on public.fm_adoptions;
create policy fm_adoptions_staff_update on public.fm_adoptions
  for update to authenticated using (public.fm_is_staff(shelter_id)) with check (public.fm_is_staff(shelter_id));

drop policy if exists fm_care_tasks_own on public.fm_care_tasks;
create policy fm_care_tasks_own on public.fm_care_tasks
  for all to authenticated using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and exists (select 1 from public.fm_adoptions a where a.id = adoption_id and a.user_id = auth.uid())
  );

-- Confirming an adoption takes the animal off the listing. Rejecting a claim
-- leaves the animal as it was.
create or replace function public.fm_on_adoption_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    update public.fm_animals set status = 'adopted', updated_at = now() where id = new.animal_id;
    new.confirmed_by := auth.uid();
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists fm_adoption_confirmed on public.fm_adoptions;
create trigger fm_adoption_confirmed
  before update on public.fm_adoptions
  for each row execute function public.fm_on_adoption_confirmed();

-- Animal photos. Public read so listing pages can show them; uploads go
-- through the server with the service role after a staff check, so no
-- storage write policy is needed. Guarded so the migration also runs on a
-- plain Postgres (the local RLS test) that has no storage schema.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('find-me-photos', 'find-me-photos', true)
    on conflict (id) do nothing;
  end if;
end $$;
