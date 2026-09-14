-- Where a team's design lives, and their published Anvil app.
--
-- A Figma link carries the file owner's account name, and the file owner is a
-- student, so the link is stored here and never committed: this repository is
-- public. The teacher reads it from the queue page and the review reads the
-- file through the Figma connector; nothing that reaches a page shows the
-- link or a name.
--
-- One row per share. The latest row per team is the one that counts, and the
-- older ones are the history of when the design was handed over.

create table if not exists public.trail_crew_design_links (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  figma_url text,
  anvil_url text,
  -- One line from the team about what is finished and what is not.
  note text,
  created_at timestamptz not null default now()
);

create index if not exists trail_crew_design_links_team_idx
  on public.trail_crew_design_links (team_slug, created_at desc);

alter table public.trail_crew_design_links enable row level security;

-- No policies on purpose. Service role only, the same as every Trail Crew
-- table: the submitting page is anonymous and the reading page is the
-- teacher's.
