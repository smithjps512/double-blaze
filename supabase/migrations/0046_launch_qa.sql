-- Launch Pad QA: what students report after playing classmates' apps at /play.
--
-- One row per report. A report names the app (its docs/launch folder, like
-- p3-da-purples), a kind (bug, confusing, idea, love), the answers to that
-- kind's questions, and the reviewing team by team name and period. No
-- student names, the same rule as everything else in Launch Pad.
--
-- Every report starts pending. The teacher approves or hides it from
-- /play/review (a signed link, no sign-in), and only approved reports are
-- shown to the team whose app it is.

create table if not exists public.launch_qa (
  id uuid primary key default gen_random_uuid(),
  app text not null check (app ~ '^[a-z0-9-]{2,60}$'),
  kind text not null check (kind in ('bug', 'confusing', 'idea', 'love')),
  answers jsonb not null default '{}'::jsonb,
  period integer not null check (period between 1 and 7),
  team_key text not null check (team_key ~ '^[a-z0-9-]{2,40}$'),
  team_name text not null check (char_length(team_name) between 2 and 40),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists launch_qa_app on public.launch_qa (app, status, created_at desc);
create index if not exists launch_qa_status on public.launch_qa (status, created_at desc);

alter table public.launch_qa enable row level security;

-- No policies on purpose: /api/launch/qa cleans everything and writes with
-- the service role, like launch_plans.
