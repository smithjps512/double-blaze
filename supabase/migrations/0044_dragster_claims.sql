-- Dragster Lab: who is driving which library car, per class period.
--
-- The Lab's Car Library holds every class blueprint as a numbered car. Any
-- class can use any car, but within one period a car belongs to one
-- Chromebook at a time, so two students in the same class never race the
-- same blueprint. Another period can still pick it.
--
-- No student identity: a claim is a period, a car number, arcade initials
-- and the random device token the Lab already keeps. Picking a new car
-- releases the device's old one.

create table if not exists public.dragster_claims (
  period integer not null check (period between 1 and 7),
  car_no integer not null check (car_no between 1 and 500),
  player_key text not null,
  initials text not null check (initials ~ '^[A-Z]{2,3}$'),
  claimed_at timestamptz not null default now(),
  primary key (period, car_no)
);

-- One car per device per period.
create unique index if not exists dragster_claims_player
  on public.dragster_claims (period, player_key);

alter table public.dragster_claims enable row level security;

-- No policies on purpose: the Lab talks to /api/dragster/claims, which
-- validates everything and writes with the service role. To free every car
-- in a period: delete from public.dragster_claims where period = N;
