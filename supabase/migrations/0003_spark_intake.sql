-- Sprint 3 (Spark intake and project brief). Extends the tables created in
-- 0001 to match spec sections 5 (steps 3-4) and 6. Migrations are additive and
-- idempotent; renames are guarded so a re-run is a no-op. RLS is left as set in
-- 0001 (client sees its own org, staff sees all) - intake and brief writes flow
-- through the service role, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type intake_status as enum ('in_progress', 'complete');
exception when duplicate_object then null; end $$;

-- Brief lifecycle gains a changes_requested state (workflow step 4 loop-back).
alter type brief_status add value if not exists 'changes_requested';

-- ---------------------------------------------------------------------------
-- intake_sessions: align column names to the spec (catalog_key, captured,
-- status). The 0001 schema used program_type / captured_fields placeholders.
-- ---------------------------------------------------------------------------
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'intake_sessions' and column_name = 'program_type')
     and not exists (select 1 from information_schema.columns
             where table_name = 'intake_sessions' and column_name = 'catalog_key')
  then
    alter table intake_sessions rename column program_type to catalog_key;
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'intake_sessions' and column_name = 'captured_fields')
     and not exists (select 1 from information_schema.columns
             where table_name = 'intake_sessions' and column_name = 'captured')
  then
    alter table intake_sessions rename column captured_fields to captured;
  end if;
end $$;

alter table intake_sessions
  add column if not exists catalog_key text,
  add column if not exists captured jsonb not null default '{}'::jsonb,
  add column if not exists status intake_status not null default 'in_progress';

-- One in-flight intake per project keeps generation idempotent.
create unique index if not exists intake_sessions_project_uidx
  on intake_sessions(project_id);

-- ---------------------------------------------------------------------------
-- project_briefs: add revision counter (bumped on each changes-requested loop).
-- ---------------------------------------------------------------------------
alter table project_briefs
  add column if not exists revision integer not null default 1;

-- At most one brief per project (no duplicate briefs, spec section 5).
create unique index if not exists project_briefs_project_uidx
  on project_briefs(project_id);
