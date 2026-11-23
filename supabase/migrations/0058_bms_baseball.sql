-- BMS Baseball: tryout interest sign ups for Blacksburg Middle School,
-- grades 6 to 8. See docs/BMS-BASEBALL.md.
--
-- Students are minors and sign up without logging in, so this table is
-- server only: RLS is on with no policies, and anon/authenticated have no
-- grants. The app reads and writes it with the service role, and the coach
-- page is behind ADMIN_PASSWORD.

create table if not exists public.bmsb_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 50),
  last_name text not null check (char_length(last_name) between 1 and 50),
  grade smallint not null check (grade in (6, 7, 8)),
  positions text[] not null check (cardinality(positions) between 1 and 10),
  years_played smallint not null check (years_played between 0 and 6),
  played_where text[] not null default '{}' check (cardinality(played_where) <= 10),
  team_names text check (char_length(team_names) <= 200),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists bmsb_signups_created_at_idx on public.bmsb_signups (created_at desc);

alter table public.bmsb_signups enable row level security;
revoke all on public.bmsb_signups from anon, authenticated;
