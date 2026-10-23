-- Launch Pad: sixth grade teams start a plan for anything.
--
-- One row per team per period, holding what they wrote at /trail-crew/launch:
-- a purpose, their users, and their user stories. The teacher exports the rows
-- to docs/launch with `npm run launch:export` and builds a prototype from each.
--
-- No accounts and no student identity, the same rule as Trail Crew and the
-- Dragster Lab. A team is a team name and a period. `team_key` is the name
-- folded to lowercase letters and hyphens, so "The Lions" and "the lions!"
-- open the same plan from two Chromebooks.
--
-- `rev` counts saves, so a Chromebook saving over a teammate's newer work is
-- told so instead of quietly winning.

create table if not exists public.launch_plans (
  id uuid primary key default gen_random_uuid(),
  period integer not null check (period between 1 and 7),
  team_key text not null check (team_key ~ '^[a-z0-9-]{2,40}$'),
  team_name text not null check (char_length(team_name) between 2 and 40),
  plan jsonb not null default '{}'::jsonb,
  rev integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists launch_plans_team
  on public.launch_plans (period, team_key);

alter table public.launch_plans enable row level security;

-- No policies on purpose. The page is anonymous and talks to /api/launch,
-- which cleans everything and writes with the service role. To clear a
-- period for next year: delete from public.launch_plans where period = N;
