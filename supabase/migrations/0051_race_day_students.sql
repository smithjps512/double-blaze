-- Race Day: which student raced which car. Teacher only.
--
-- First names only, and only in the database: never in this repository,
-- which is public. The class pages show a name only when show_name is on,
-- which the teacher sets once that student's permission is in. Until then a
-- student is a car. No photos are stored here.
--
-- car_note is how the car looked in the photo the match came from, to help
-- the teacher confirm it against the clip. Car descriptions only.

create table if not exists public.race_day_students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 40),
  car_note text not null default '',
  car_id text references public.race_day_cars (id) on delete set null,
  show_name boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists race_day_students_car on public.race_day_students (car_id);

alter table public.race_day_students enable row level security;

-- No policies on purpose: only /api/race-day/teacher, behind the teacher
-- code, reads or writes this table, with the service role.
