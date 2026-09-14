-- Live progress on a team's build cards.
--
-- Every other document a team has is a file in git, changed by a teacher's
-- approval. Progress is the one thing that is not: a box ticked at 10:14 on a
-- Tuesday is not a document, needs no review, and has to still be ticked when
-- the same Chromebook is opened by a different teammate at 10:15. So it lives
-- here, keyed by team and card, and the cards page and the gallery read it.
--
-- Team level only, like everything else in Trail Crew. Nobody signs in and no
-- student identity is stored. A tick is the team's, not a person's.
--
-- Rows are addressed by the card's title slug and the criterion's own text
-- rather than by position, so a teacher renumbering the cards, or a story
-- rewriting its card, does not untick the boxes that still match. A criterion
-- that was reworded does lose its tick, which is correct: it is a new finish
-- line.

create table if not exists public.trail_crew_progress (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  card_slug text not null,
  -- Null for the card's own status row; the criterion text for a tick row.
  criterion text,
  -- For a card row: 'not_started', 'building', 'done'. For a tick row: 'done'
  -- or 'open'.
  state text not null default 'open'
    check (state in ('not_started', 'building', 'done', 'open')),
  updated_at timestamptz not null default now()
);

-- One row per card, and one per criterion on it. Postgres treats nulls as
-- distinct in a plain unique constraint, so the card row is keyed on an empty
-- string via the expression index below.
create unique index if not exists trail_crew_progress_key
  on public.trail_crew_progress (team_slug, card_slug, coalesce(criterion, ''));

create index if not exists trail_crew_progress_team_idx
  on public.trail_crew_progress (team_slug);

alter table public.trail_crew_progress enable row level security;

-- No policies on purpose. Reads and writes come from the server with the
-- service role key. The page that ticks a box is anonymous and validates the
-- team, the card and the criterion against the committed build documents
-- before it writes anything.
