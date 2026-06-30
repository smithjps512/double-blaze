-- Sprint T2: Trail Run intake to build brief.
--
-- Spark (the conversational intake agent) captures what we need to build, then
-- assembles a structured Trail Run Build Brief. This migration extends the
-- existing intake/brief tables from 0001 and adds the standardized Blue Trail
-- build checklist (build_tasks). The Trail Run lifecycle itself lives in
-- trail_run_engagements (migration 0005) and is not changed here; T2 only flips
-- its status from signup to building when the brief is routed.
--
-- The build is represented by a `projects` row (spec section 5, step 3) linked
-- to the engagement. Brief and checklist key to that project, which is
-- organization-scoped, so org-scoping and the existing RLS carry over.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type intake_status as enum ('in_progress', 'complete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type build_task_type as enum (
    'website', 'ecommerce', 'social', 'workflow',
    'ai_support', 'inventory', 'kpi_dashboard'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type build_task_status as enum ('not_started', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- intake_sessions: add a resumability status. The 0001 schema already carries
-- transcript (jsonb) and captured_fields (jsonb); Spark appends to those each
-- turn so a client can leave and return without losing answers.
-- ---------------------------------------------------------------------------
alter table intake_sessions
  add column if not exists status intake_status not null default 'in_progress';

-- One in-flight intake per project keeps turn handling and generation idempotent.
create unique index if not exists intake_sessions_project_uidx
  on intake_sessions(project_id);

-- ---------------------------------------------------------------------------
-- project_briefs: the Spark-generated Trail Run Build Brief. 0001 already has
-- content (jsonb), rendered_summary, status, accepted_by/at. Add the raw intake
-- snapshot and the non-blocking feasibility flags surfaced for human review.
-- For Trail Run we do not run the client acceptance loop; a generated brief is
-- moved to submitted_for_acceptance to mean "assembled and routed to the team".
-- ---------------------------------------------------------------------------
alter table project_briefs
  add column if not exists feasibility_flags jsonb not null default '[]'::jsonb,
  add column if not exists raw_intake jsonb;

create unique index if not exists project_briefs_project_uidx
  on project_briefs(project_id);

-- ---------------------------------------------------------------------------
-- projects: link the build project back to its Trail Run engagement (0005).
-- Nullable: non-Trail-Run projects leave it null. We do not alter the
-- engagements table; the link lives here.
-- ---------------------------------------------------------------------------
alter table projects
  add column if not exists trail_run_engagement_id uuid
    references trail_run_engagements(id) on delete set null;
create index if not exists projects_trail_run_engagement_idx
  on projects(trail_run_engagement_id);

-- ---------------------------------------------------------------------------
-- build_tasks: the standardized Blue Trail checklist, one set per build.
-- Internal only: clients must never read this. Staff (project_lead, admin)
-- read and write within their scope; the service role bypasses RLS.
-- ---------------------------------------------------------------------------
create table if not exists build_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_type build_task_type not null,
  title text not null,
  status build_task_status not null default 'not_started',
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists build_tasks_project_idx on build_tasks(project_id);

drop trigger if exists set_updated_at on build_tasks;
create trigger set_updated_at before update on build_tasks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: build_tasks is staff-only. No client read policy is granted, so a
-- client (authenticated, org-scoped) sees nothing. Writes flow through the
-- service role or staff.
-- ---------------------------------------------------------------------------
alter table build_tasks enable row level security;

drop policy if exists build_tasks_staff_all on build_tasks;
create policy build_tasks_staff_all on build_tasks
  for all using (is_staff()) with check (is_staff());
