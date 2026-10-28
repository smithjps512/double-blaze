-- Game Studio: a team's game design doc, at /studio.
--
-- The same shape as launch_plans (see 0045): one row per team per period,
-- the design as jsonb, and a rev that counts saves so two Chromebooks on one
-- team are told when they would overwrite each other. The teacher exports
-- the rows with `npm run studio:export` for the Double Blaze builds.
--
-- No accounts and no student names: a team is a studio name and a period.

create table if not exists public.studio_designs (
  id uuid primary key default gen_random_uuid(),
  period integer not null check (period between 1 and 7),
  team_key text not null check (team_key ~ '^[a-z0-9-]{2,40}$'),
  team_name text not null check (char_length(team_name) between 2 and 40),
  design jsonb not null default '{}'::jsonb,
  rev integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists studio_designs_team on public.studio_designs (period, team_key);

alter table public.studio_designs enable row level security;

-- No policies on purpose: /api/studio cleans everything and writes with the
-- service role, like launch_plans.
