-- Launch Pad votes: a class choosing what comes next, at /vote.
--
-- One row per Chromebook per poll. A ballot ranks every option in the poll
-- (ranking is the option ids in order, first choice first) and says in one
-- sentence why the first choice is first. Who voted is a period and a team
-- name, the same as Launch Pad and /play. No student names.
--
-- `voter_key` is a random token the browser keeps, like the Dragster Lab's
-- player key, so one Chromebook has one vote and voting again replaces it.
-- It says nothing about who is holding the Chromebook.

create table if not exists public.launch_votes (
  id uuid primary key default gen_random_uuid(),
  poll text not null check (poll ~ '^[a-z0-9-]{2,60}$'),
  period integer not null check (period between 1 and 7),
  team_key text not null check (team_key ~ '^[a-z0-9-]{2,40}$'),
  team_name text not null check (char_length(team_name) between 2 and 40),
  voter_key text not null check (voter_key ~ '^[A-Za-z0-9_-]{16,64}$'),
  ranking jsonb not null,
  why text not null check (char_length(why) between 5 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists launch_votes_voter on public.launch_votes (poll, voter_key);

alter table public.launch_votes enable row level security;

-- No policies on purpose: /api/launch/vote checks every ballot and writes
-- with the service role. To reset a poll: delete from public.launch_votes where poll = '...';
