-- Architecture drafts join the approval queue.
--
-- When a teacher approves a story, the build card rewrites itself from the
-- story with no model involved. The architecture cannot: which screens a
-- feature needs, what to call the components, and which patterns in what
-- order is judgement. So Spark drafts the change to the architecture page and
-- the draft lands here as a pending row, in the same queue as the students'
-- story proposals, for the same teacher to read, edit and approve.
--
-- Nothing else changes: approval still commits, git is still the audit trail,
-- and a draft nobody approves changes nothing.

alter table public.trail_crew_story_edits
  drop constraint if exists trail_crew_story_edits_kind_check;

alter table public.trail_crew_story_edits
  add constraint trail_crew_story_edits_kind_check
    check (kind in ('edit', 'new', 'architecture'));

-- The proposal columns had no length limit in the database, only in the
-- application; an architecture draft is a whole page, so nothing to change.
