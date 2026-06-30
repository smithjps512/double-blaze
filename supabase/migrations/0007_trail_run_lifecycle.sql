-- Sprint T3: Trail Run launch and lifecycle.
--
-- Adds the launch and check-in machinery on top of T1 (engagement spine) and
-- T2 (intake to brief). This migration:
--   1. Tightens project_briefs to staff-only (the client sees the separate
--      rendered_summary, never the internal brief row, flags, or raw intake).
--   2. Makes projects.trail_run_engagement_id canonical and unique (one build
--      per engagement) and adds live_url for the launched solution.
--   3. Adds lifecycle_events: an append-only audit of launch, check-ins,
--      cancellation, etc.
--   4. Adds trail_run_checkins: the idempotent check-in send ledger, with a
--      status state machine (pending, sent, failed) so an at-least-once cron
--      can claim then send then mark, retry failures, and never double-send.
--
-- Does not build T4 (day-31 conversion, take-offline, the 90-day purge,
-- reactivation, the admin dashboard).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. project_briefs is staff-only. Drop the org-scoped client read policy from
--    0001; feasibility_flags and raw_intake are internal reasoning.
-- ---------------------------------------------------------------------------
drop policy if exists project_briefs_client_read on project_briefs;

-- ---------------------------------------------------------------------------
-- 2. projects: live_url, and a unique link to the engagement (one build per
--    engagement), replacing the non-unique index from 0006.
-- ---------------------------------------------------------------------------
alter table projects
  add column if not exists live_url text;

drop index if exists projects_trail_run_engagement_idx;
create unique index if not exists projects_trail_run_engagement_uidx
  on projects(trail_run_engagement_id)
  where trail_run_engagement_id is not null;

-- ---------------------------------------------------------------------------
-- 3. lifecycle_events: append-only audit, keyed to the engagement. Records
--    immutable facts (launched, checkin_sent, canceled). No updated_at: rows
--    are never mutated. Mutable send state lives in trail_run_checkins, not
--    here, so this table stays a clean event log.
-- ---------------------------------------------------------------------------
create table if not exists lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references trail_run_engagements(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lifecycle_events_engagement_idx
  on lifecycle_events(engagement_id);

alter table lifecycle_events enable row level security;
drop policy if exists lifecycle_events_staff_all on lifecycle_events;
create policy lifecycle_events_staff_all on lifecycle_events
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- 4. trail_run_checkins: idempotent send ledger. One row per (engagement,
--    target day in {14,7,3,1}). The daily cron claims a row, sends, then marks
--    sent or failed; a later run retries pending or failed rows whose window
--    has not passed. The unique constraint is the hard no-double-send guard.
-- ---------------------------------------------------------------------------
do $$ begin
  create type checkin_status as enum ('pending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists trail_run_checkins (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references trail_run_engagements(id) on delete cascade,
  checkin_day integer not null,        -- 14, 7, 3, or 1
  status checkin_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Hard no-double-send: at most one ledger row per engagement per target day.
create unique index if not exists trail_run_checkins_engagement_day_uidx
  on trail_run_checkins(engagement_id, checkin_day);
create index if not exists trail_run_checkins_status_idx
  on trail_run_checkins(status);

drop trigger if exists set_updated_at on trail_run_checkins;
create trigger set_updated_at before update on trail_run_checkins
  for each row execute function set_updated_at();

alter table trail_run_checkins enable row level security;
drop policy if exists trail_run_checkins_staff_all on trail_run_checkins;
create policy trail_run_checkins_staff_all on trail_run_checkins
  for all using (is_staff()) with check (is_staff());
