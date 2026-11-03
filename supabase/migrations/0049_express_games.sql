-- Studio Express: games designed and built in one class, at /express.
--
-- One row per build. A row holds the student's design, the spec the engine
-- plays (data only, cleaned on the server), who designed the spec ("spark"
-- or "rules"), and a short public slug for the play link. Students are
-- initials and a studio name, the same rule as the rest of the class.
--
-- `device_key` is a random token the browser keeps, like the Dragster Lab's,
-- so one Chromebook gets a few builds a day and the teacher's list shows each
-- Chromebook's latest game. It says nothing about who is holding it.

create table if not exists public.express_games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]{8}$'),
  period integer not null check (period between 1 and 7),
  initials text not null check (initials ~ '^[A-Z]{2,3}$'),
  studio text not null check (char_length(studio) between 2 and 40),
  device_key text not null check (device_key ~ '^[A-Za-z0-9_-]{16,64}$'),
  design jsonb not null,
  spec jsonb not null,
  built_by text not null check (built_by in ('spark', 'rules')),
  created_at timestamptz not null default now()
);

create index if not exists express_games_day on public.express_games (period, created_at desc);
create index if not exists express_games_device on public.express_games (device_key, created_at desc);

alter table public.express_games enable row level security;

-- No policies on purpose: /api/express checks everything and writes with the
-- service role. To clear a day: delete from public.express_games where created_at < now() - interval '1 day';
