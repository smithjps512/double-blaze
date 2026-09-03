-- Student proposals to change a user story, and the teacher's decision.
--
-- Nothing here changes a document. A row is a proposal; the story file in the
-- repository only changes when a teacher approves, and approval writes a commit
-- so git history is the audit trail.
--
-- No student identity. As with the helper, the team slug comes from the page URL
-- and that is all this feature knows or wants to know about who is asking.

create table if not exists public.trail_crew_story_edits (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  -- The story's heading in user-stories.md, which is how the edit finds its
  -- place in the file again at approval time.
  story_heading text not null,
  original_text text not null,
  proposed_text text not null,
  -- The team's own explanation of why, which is usually the most useful part
  -- for the teacher and is often better writing than the change itself.
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  -- Set by the screening pass. Flagged rows still reach the queue: the teacher
  -- sees everything, because a wrongly flagged real proposal must not vanish.
  flagged boolean not null default false,
  flag_reason text,
  -- What was actually committed, which may be the teacher's edit of the
  -- proposal rather than the proposal itself.
  applied_text text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trail_crew_story_edits_pending_idx
  on public.trail_crew_story_edits (status, created_at desc);

create index if not exists trail_crew_story_edits_team_idx
  on public.trail_crew_story_edits (team_slug, created_at desc);

alter table public.trail_crew_story_edits enable row level security;

-- No policies, on purpose. The submission route inserts with the service role
-- and the staff queue reads with it behind a Clerk staff check. Students' words
-- are not public and the page that collects them is anonymous.
