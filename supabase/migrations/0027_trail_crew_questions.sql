-- Questions students ask the Trail Crew helper.
--
-- Team level only. This feature has no accounts and collects no student
-- identity, so there is none to store here: the team slug comes from the page
-- URL and nothing else about the asker is known or wanted.
--
-- The value of the table is the teacher's view of it. One teacher cannot reach
-- thirteen teams during a work session, but "four teams asked about saving a
-- row in the last ten minutes" is a whole class worth of information.

create table if not exists public.trail_crew_questions (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  question text not null,
  answered boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists trail_crew_questions_team_idx
  on public.trail_crew_questions (team_slug, created_at desc);

create index if not exists trail_crew_questions_recent_idx
  on public.trail_crew_questions (created_at desc);

alter table public.trail_crew_questions enable row level security;

-- No policies on purpose. Inserts come from the server with the service role
-- key, which bypasses RLS; nothing else may read or write. Student questions
-- are not public, and the page that collects them is anonymous.
