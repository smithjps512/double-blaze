-- User test sheets, their results, and the bugs they found.
--
-- A team's build cards are promises, and a user test sheet is somebody else
-- checking them. Until now the sheet was paper (or a Word file) and what it
-- found went nowhere the cards could see. These three tables are the sheet,
-- live: one row per sheet, one per card tested or bug re-tested, one per bug.
-- The cards page and the project board read them so a card that failed a test
-- says so, and a class-wide priority board puts every open bug in an order
-- the engine works out by rule (packages/prototype-forge/src/test-results.ts).
--
-- Team level only, like everything else in Trail Crew. Nobody signs in and no
-- student identity is stored. A sheet is numbered per team ("Tester 2"), not
-- named. The Word sheet asks for a name; this does not.
--
-- Rows are addressed by the card's title slug, as progress is, so a teacher
-- renumbering the cards does not lose a result. A result on a card the team
-- deleted stays in the table and simply has no card to land on.
--
-- Nothing here holds a bug's status. A bug is open until a passing re-test
-- of it is recorded (a result row naming the bug), and the engine derives
-- that from the rows on every read. One source of truth, and the one the
-- team asked for: the only way off the board is to run the test again and
-- have it pass.

create table if not exists public.trail_crew_test_sheets (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  -- "Tester 1", "Tester 2": the sheet's number within the team, never a name.
  tester text not null default 'Tester',
  device text,
  tested_on date not null default current_date,
  -- Part 5 of the sheet, in the tester's own words.
  keep text[] not null default '{}',
  change text[] not null default '{}',
  missing_story text,
  -- Part 4: five ratings from 1 to 5, in the sheet's order, or null when not given.
  ratings smallint[],
  created_at timestamptz not null default now()
);

create index if not exists trail_crew_test_sheets_team_idx
  on public.trail_crew_test_sheets (team_slug);

create table if not exists public.trail_crew_bugs (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  sheet_id uuid references public.trail_crew_test_sheets (id) on delete set null,
  -- Null when the tester could not say which card, or it is about the whole app.
  card_slug text,
  title text not null,
  steps text,
  -- 1 small, 2 annoying, 3 cannot continue. Null when the tester did not say.
  severity smallint check (severity between 1 and 3),
  -- Where a teacher put it by hand. Null means the rule decides.
  teacher_priority text check (teacher_priority in ('now', 'next', 'later')),
  created_at timestamptz not null default now()
);

create index if not exists trail_crew_bugs_team_idx
  on public.trail_crew_bugs (team_slug);

create table if not exists public.trail_crew_test_results (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  sheet_id uuid references public.trail_crew_test_sheets (id) on delete set null,
  -- The card tested. Null only for a re-test of a bug that names no card.
  card_slug text,
  -- Set when this result is a re-test of one bug rather than of the card.
  bug_id uuid references public.trail_crew_bugs (id) on delete cascade,
  outcome text not null check (outcome in ('pass', 'fail')),
  constraint trail_crew_test_results_subject check (card_slug is not null or bug_id is not null),
  what_i_did text,
  what_happened text,
  created_at timestamptz not null default now()
);

create index if not exists trail_crew_test_results_team_idx
  on public.trail_crew_test_results (team_slug);

create index if not exists trail_crew_test_results_bug_idx
  on public.trail_crew_test_results (bug_id)
  where bug_id is not null;

alter table public.trail_crew_test_sheets enable row level security;
alter table public.trail_crew_bugs enable row level security;
alter table public.trail_crew_test_results enable row level security;

-- No policies on purpose, as with trail_crew_progress. Reads and writes come
-- from the server with the service role key. The page that records a result
-- is anonymous and validates the team, the card and the bug against the
-- committed build documents before it writes anything.
