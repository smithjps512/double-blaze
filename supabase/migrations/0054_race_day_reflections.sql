-- Race Day: the CO2 dragster project reflection.
--
-- Students write a 30 to 45 minute reflection on the whole project at
-- /trail-crew/dragster/race-day/reflection, behind the class password, and
-- the teacher reads, scores and comments at .../teacher/reflections.
--
-- Full names live only here, never in the repository, which is public. The
-- questions are in apps/platform/src/lib/race-day/reflection.ts; answers are
-- keyed by question id in a jsonb column so a reworded question never needs
-- a migration. A student who turns it in again adds a new row; the teacher
-- screen shows the newest and keeps the older ones.

create table if not exists public.race_day_reflections (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 3 and 80),
  period integer not null check (period between 1 and 7),
  ratings jsonb not null,
  answers jsonb not null,
  words integer not null check (words >= 0),
  submitted_at timestamptz not null default now(),
  -- Teacher only.
  score integer check (score between 0 and 20),
  teacher_note text not null default '' check (char_length(teacher_note) <= 4000),
  reviewed boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists race_day_reflections_period on public.race_day_reflections (period, submitted_at desc);

alter table public.race_day_reflections enable row level security;

-- No policies on purpose: only /api/race-day/reflection, behind the class
-- password (submit) and the teacher code (read, score), touches this table,
-- with the service role.
