-- Period 3 Smart Cities: answers to "Questions for the designer" and the game
-- leaderboards.
--
-- The four living maps at /demo/period-3-smart-cities/ were built from sixth
-- grade drawings, and each one ends with a few questions the drawing left open.
-- Students answer them here. An answer waits for the teacher, and only an
-- approved answer appears on the city page for the class to read.
--
-- No accounts and no student identity, the same rule Trail Crew follows. An
-- answer says which city and which question, and whether the writer says they
-- drew the city or are a classmate. That is all.
--
-- Scores are posted under arcade initials (two or three letters), checked on
-- the server against a short list of words that should not appear on a class
-- screen. `player_key` is a random token the browser keeps so one device's
-- best score replaces its older ones instead of filling the board. It says
-- nothing about who is holding the Chromebook.

create table if not exists public.smart_city_answers (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null,
  -- Position in the city's question list (0-based), checked by the server
  -- against the questions in src/lib/smart-cities.ts.
  question_index integer not null check (question_index >= 0),
  answer text not null,
  -- 'designer': the writer says they drew this city. 'classmate': anyone else.
  writer text not null default 'classmate' check (writer in ('designer', 'classmate')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Screening only tags. It never hides or rejects an answer.
  flagged boolean not null default false,
  flag_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists smart_city_answers_status_idx
  on public.smart_city_answers (status, created_at desc);
create index if not exists smart_city_answers_city_idx
  on public.smart_city_answers (city_slug, status);

alter table public.smart_city_answers enable row level security;

create table if not exists public.smart_city_scores (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null,
  -- Which game: 'hunt' (scavenger hunt) on every city, plus each city's own
  -- game ('power', 'safety', 'dispatch', ...). The server checks it against
  -- the city's list in src/lib/smart-cities.ts; the database only checks shape.
  mode text not null check (mode ~ '^[a-z]{3,16}$'),
  initials text not null check (initials ~ '^[A-Z]{2,3}$'),
  score integer not null check (score >= 0 and score <= 1000),
  player_key text not null,
  created_at timestamptz not null default now()
);

-- One row per device per game: a better score replaces the old one.
create unique index if not exists smart_city_scores_player
  on public.smart_city_scores (city_slug, mode, player_key);
create index if not exists smart_city_scores_board
  on public.smart_city_scores (city_slug, mode, score desc);

alter table public.smart_city_scores enable row level security;

-- No policies on purpose, on either table. The city pages are anonymous and
-- talk to /api/smart-cities, which validates everything and writes with the
-- service role. The teacher's page reads and decides behind a Clerk staff check.
