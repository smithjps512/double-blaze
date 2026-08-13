-- Demo content, and the three things that make seeding a live database safe.
--
-- James is running a user test with real testers. A tester cannot test "access
-- media", "react to a post", or "connect with members" in an empty club,
-- because there is nothing to do it to, so the club has to be populated before
-- the test rather than after it.
--
-- Populating a live database with invented people is a thing that goes wrong in
-- exactly one way: somebody forgets, and the invented people are still there
-- when the club launches. Build plan section 4 asks for three defences, and this
-- migration is all three:
--
--   1. **Flagged rows.** Every seeded row carries is_demo, so "which of these is
--      real" is a query rather than a memory.
--   2. **A purge.** One call removes all of it, in dependency order, and reports
--      what it removed.
--   3. **A publish-time guard.** The site cannot be published while demo rows
--      exist. Not a warning: the database refuses, the same way the
--      last-administrator guard in 0019 refuses.
--
-- The third one is the point. The first two are only as good as somebody
-- remembering to use them, and the whole risk here is that nobody does.
--
-- Two content rules go with this and are not enforceable in SQL, so they are
-- written in the seed file instead: fictional employers only, never a real
-- utility, and no fabricated statistics in any article body. A seeded article
-- inventing a load-growth figure under a real utility's name is the kind of
-- thing that outlives the demo and gets quoted back at somebody.

-- ---------------------------------------------------------------------------
-- 1. The flag
-- ---------------------------------------------------------------------------

alter table site_members add column if not exists is_demo boolean not null default false;
alter table site_articles add column if not exists is_demo boolean not null default false;
alter table site_article_series add column if not exists is_demo boolean not null default false;

comment on column site_members.is_demo is
  'Seeded for a demonstration or a user test. Purged by app.purge_site_demo_rows, and blocks publication until it is.';
comment on column site_articles.is_demo is 'See site_members.is_demo.';
comment on column site_article_series.is_demo is 'See site_members.is_demo.';

-- Partial indexes, because the interesting question is always "are there any",
-- and demo rows are a small minority of a real club's rows or none at all.
create index if not exists site_members_demo_idx on site_members(site_id) where is_demo;
create index if not exists site_articles_demo_idx on site_articles(site_id) where is_demo;
create index if not exists site_article_series_demo_idx on site_article_series(site_id) where is_demo;

-- ---------------------------------------------------------------------------
-- 2. Nobody flags themselves
-- ---------------------------------------------------------------------------
--
-- is_demo now decides whether a club can go live, which makes it worth one more
-- line in each of the two guards that already exist. A member who could set it
-- on their own row could stop their club launching.
--
-- Both functions are replaced rather than extended, because a trigger holds its
-- function by identity and replacing the body is the whole change.

create or replace function app.guard_site_member_self_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Only members. The service role claims memberships, and inside a definer
  -- function current_user is the function owner, so auth.role() is what tells
  -- a member apart from the platform. See section 5 of status.md.
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  -- Staff and site administrators legitimately change these fields.
  -- old.site_id, not new: the question is whether the caller may administer
  -- the row as it stands, not the site it is being moved to.
  if is_staff() or app.is_site_admin(old.site_id) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.site_id is distinct from old.site_id
     or new.auth_user_id is distinct from old.auth_user_id
     or new.email is distinct from old.email
     or new.access_expires_at is distinct from old.access_expires_at
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.is_demo is distinct from old.is_demo
     or new.invited_by is distinct from old.invited_by then
    raise exception 'A member may not change their own role, status, identity, or approval.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create or replace function app.guard_site_article_author_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- The read counter in 0023 updates this table from inside another trigger.
  -- Nothing a member can send directly is nested, because a member cannot
  -- create a trigger, so depth is what tells our own writes apart from theirs.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if is_staff() or app.is_site_admin(old.site_id) then
    return new;
  end if;

  if new.site_id is distinct from old.site_id
     or new.author_id is distinct from old.author_id
     or new.is_demo is distinct from old.is_demo then
    raise exception 'An article cannot change its author, its club, or whether it is demonstration content.'
      using errcode = 'insufficient_privilege';
  end if;

  if old.status = 'removed' or new.status = 'removed' then
    raise exception 'Only an administrator removes or restores an article.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.total_reads is distinct from old.total_reads
     or new.unique_readers is distinct from old.unique_readers then
    raise exception 'Reader counts are maintained by the database.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. The publish-time guard
-- ---------------------------------------------------------------------------
--
-- A site with demo rows cannot be published. Anything else, including moving it
-- back to draft or suspending it, is untouched.
--
-- In the database rather than in the publish route, for the reason 0019 gives:
-- a console can warn, and a warning is what somebody clicks past at the end of
-- a long day. Launching a club with six invented members in its directory is
-- not a thing to leave to attention.
--
-- The message names the purge, because the person reading it is mid-launch and
-- should not have to go and find out how to fix it.

create or replace function app.guard_site_publish_without_demo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_members int;
  v_articles int;
  v_series int;
begin
  if new.status <> 'published' or old.status = 'published' then
    return new;
  end if;

  select count(*) into v_members from site_members where site_id = new.id and is_demo;
  select count(*) into v_articles from site_articles where site_id = new.id and is_demo;
  select count(*) into v_series from site_article_series where site_id = new.id and is_demo;

  if v_members + v_articles + v_series > 0 then
    raise exception
      'This site still holds demonstration content: % members, % articles, % series. Run select app.purge_site_demo_rows(%L) before publishing.',
      v_members, v_articles, v_series, new.id
      using errcode = 'raise_exception';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_publish_without_demo on sites;
create trigger guard_publish_without_demo before update on sites
  for each row execute function app.guard_site_publish_without_demo();

-- ---------------------------------------------------------------------------
-- 4. The purge
-- ---------------------------------------------------------------------------
--
-- One call, in dependency order, reporting what went. Deleting the members
-- alone would take their articles with them by cascade, but doing it explicitly
-- means the count is honest and a demo article written by a real member is
-- caught too.
--
-- In `app` rather than `public`, so PostgREST does not expose it. Purging a
-- club's content is not something that should be one HTTP request away, and the
-- people who run it have SQL access anyway.
--
-- Storage is the one thing it cannot finish. A demo article with a recording
-- has bytes in the member-media bucket, and deleting the row does not delete
-- them, so the paths come back in the result for whoever runs this to remove.

create or replace function app.purge_site_demo_rows(p_site_id uuid)
returns table (
  removed_articles int,
  removed_series int,
  removed_members int,
  orphaned_media text[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_media text[];
  v_articles int;
  v_series int;
  v_members int;
begin
  select coalesce(array_agg(media_path), '{}')
    into v_media
    from site_articles
   where site_id = p_site_id and is_demo and media_path is not null;

  with gone as (
    delete from site_articles where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_articles from gone;

  with gone as (
    delete from site_article_series where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_series from gone;

  with gone as (
    delete from site_members where site_id = p_site_id and is_demo returning 1
  ) select count(*) into v_members from gone;

  return query select v_articles, v_series, v_members, v_media;
end;
$$;

revoke execute on function app.purge_site_demo_rows(uuid) from public, anon, authenticated;
