-- Melissa for Makers: user test sheets, results and bugs.
--
-- The Melissa version of double-blaze migration 0038_trail_crew_testing.sql,
-- for supabase/migrations in melissa-platform. Keyed by team id rather than
-- team slug, RLS scoped to the class's teacher through
-- classes.teacher_id = auth.uid(), the pattern makers_teams uses. Server code
-- reaches these with the service role client and filters by teacher in code;
-- the policies are the backstop.
--
-- Nothing here holds a bug's status. A bug is open until a passing re-test
-- of it is recorded (a makers_test_results row naming the bug), and the
-- engine (src/lib/makers/engine/test-results.ts: bugStates, summariseTesting,
-- rankBugs) derives that on every read. One source of truth.
--
-- A sheet may carry the tester's pseudonym, because a Melissa student is
-- signed in. Never a roster name.
--
-- Apply through the Supabase MCP as part of the same change, per
-- docs/claude.md, with the connector on the Game View organization (project
-- fwmdaepypirducucqiyx). Add the row types to src/types/database.ts.

create table if not exists public.makers_test_sheets (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.makers_teams (id) on delete cascade,
  -- The tester's pseudonym on their own team, or "Tester N" when unknown.
  tester text not null default 'Tester',
  device text,
  tested_on date not null default current_date,
  keep text[] not null default '{}',
  change text[] not null default '{}',
  missing_story text,
  ratings smallint[],
  created_at timestamptz not null default now()
);

create index if not exists makers_test_sheets_team_idx
  on public.makers_test_sheets (team_id);

create table if not exists public.makers_bugs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.makers_teams (id) on delete cascade,
  sheet_id uuid references public.makers_test_sheets (id) on delete set null,
  -- The card's title slug from the current cards document, or null for the whole app.
  card_slug text,
  title text not null,
  steps text,
  severity smallint check (severity between 1 and 3),
  teacher_priority text check (teacher_priority in ('now', 'next', 'later')),
  created_at timestamptz not null default now()
);

create index if not exists makers_bugs_team_idx
  on public.makers_bugs (team_id);

create table if not exists public.makers_test_results (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.makers_teams (id) on delete cascade,
  sheet_id uuid references public.makers_test_sheets (id) on delete set null,
  card_slug text,
  bug_id uuid references public.makers_bugs (id) on delete cascade,
  outcome text not null check (outcome in ('pass', 'fail')),
  constraint makers_test_results_subject check (card_slug is not null or bug_id is not null),
  what_i_did text,
  what_happened text,
  created_at timestamptz not null default now()
);

create index if not exists makers_test_results_team_idx
  on public.makers_test_results (team_id);

create index if not exists makers_test_results_bug_idx
  on public.makers_test_results (bug_id)
  where bug_id is not null;

alter table public.makers_test_sheets enable row level security;
alter table public.makers_bugs enable row level security;
alter table public.makers_test_results enable row level security;

-- The class's teacher owns the rows, through the team.
do $$
declare t text;
begin
  foreach t in array array['makers_test_sheets', 'makers_bugs', 'makers_test_results'] loop
    execute format($f$
      drop policy if exists %1$s_teacher on public.%1$s;
      create policy %1$s_teacher on public.%1$s
        for all to authenticated
        using (
          exists (
            select 1 from public.makers_teams mt
            join public.classes c on c.id = mt.class_id
            where mt.id = %1$s.team_id and c.teacher_id = auth.uid()
          )
        )
        with check (
          exists (
            select 1 from public.makers_teams mt
            join public.classes c on c.id = mt.class_id
            where mt.id = %1$s.team_id and c.teacher_id = auth.uid()
          )
        );
    $f$, t);
  end loop;
end $$;
