-- New stories, not just edits to existing ones.
--
-- The story studio writes a story that is not in the team's file yet, so the
-- proposal has no original text and no block to replace. One column tells the
-- publisher which it is; everything else about the queue, the screening, the
-- email and the commit stays exactly as it was, which is the point of putting
-- it here rather than building a second queue for the teacher to watch.
alter table public.trail_crew_story_edits
  add column if not exists kind text not null default 'edit'
    check (kind in ('edit', 'new'));
