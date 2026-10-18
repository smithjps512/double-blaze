-- Dragster Lab: the class board for virtual CO2 dragsters.
--
-- Intro to Technology students build a virtual twin of the dragster on their
-- blueprint at /trail-crew/dragster, then mod it and race it. Each row is one
-- device's best legal car for one period and one stage.
--
-- No accounts and no student identity, the same rule Trail Crew and the
-- smart cities follow. A row is arcade initials (two or three letters,
-- checked on the server against the same short blocklist), a class period,
-- the car's measurements, and the time. The server re-runs the physics on the
-- car before storing it, so the time is always the time that car makes.
--
-- `player_key` is a random token the browser keeps so one Chromebook's best
-- run replaces its older ones. It says nothing about who is holding it.

create table if not exists public.dragster_runs (
  id uuid primary key default gen_random_uuid(),
  period integer not null check (period between 1 and 7),
  -- 'twin': the car exactly as the blueprint says. 'mod': after the mod shop.
  kind text not null check (kind in ('twin', 'mod')),
  initials text not null check (initials ~ '^[A-Z]{2,3}$'),
  time_ms integer not null check (time_ms between 500 and 6000),
  car jsonb not null,
  player_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists dragster_runs_player
  on public.dragster_runs (period, kind, player_key);
create index if not exists dragster_runs_board
  on public.dragster_runs (period, kind, time_ms asc);

alter table public.dragster_runs enable row level security;

-- No policies on purpose. The Lab is anonymous and talks to /api/dragster,
-- which validates everything and writes with the service role. To clear a
-- period before a new race: delete from public.dragster_runs where period = N;
