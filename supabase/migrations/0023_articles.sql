-- Articles, series, and reading counts (session 5).
--
-- The core of the brief: members publish written pieces, audio, and embedded
-- video into a library only members can read, and each article carries a total
-- and a unique reader count.
--
-- Three tables. Everything is scoped by site_id and every policy keys on it,
-- like the rest of the member plane.
--
-- ---------------------------------------------------------------------------
-- One table for three kinds, not three tables
-- ---------------------------------------------------------------------------
--
-- A written piece, an audio piece, and an embedded video differ in one field
-- each and share everything else: an author, a title, a summary, a slug, a
-- series, a status, and a reader count. Splitting them would mean three sets of
-- policies, three slug namespaces, and a union in every query that lists the
-- library, which is the query this application runs most.
--
-- The kind decides which of `body`, `media_path`, and `embed_id` is required,
-- and that rule lives in lib/articles.ts where it can be unit tested and where
-- the form reads it too. A check constraint here would say the same thing in a
-- second place and drift from it.
--
-- ---------------------------------------------------------------------------
-- What is stored about reading, and what deliberately is not
-- ---------------------------------------------------------------------------
--
-- The brief asks for total and unique reader counts per article. Section 3 of
-- the build plan flags that this is member-level reading data, and that who may
-- see it and how long it is kept belongs in the policy a member agrees to. That
-- policy is session 9, so this migration takes the decision that leaves session
-- 9 the most room:
--
--   * One row per member per article. Not an event log. Two columns answer both
--     questions the brief asks, and an event stream would additionally answer
--     "when did Dana read this, and how often", which nobody asked for and which
--     is the part with a retention problem.
--   * A reader sees only their own row. Aggregates live on the article, so the
--     library can show "read by 14 members" without anyone being able to ask
--     which fourteen. An administrator can read the rows; nobody else can.
--   * Reloading inside half an hour is one read. It makes the number mean
--     something, and it makes inflating it tedious rather than free.
--   * An author reading their own piece is not counted at all.
--
-- If the club later decides reading data should not be kept per member, the
-- change is dropping one table and keeping two integers.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type site_article_kind as enum (
    -- Prose, held in `body`.
    'written',
    -- Self-hosted in the member-media bucket from 0022, which already accepts
    -- audio at 50MB. `body` becomes show notes or a transcript.
    'audio',
    -- Embedded from YouTube or Vimeo, per the media decision in build plan
    -- section 2. Only the provider and the video id are stored, never a URL the
    -- author typed, because the id is what gets built into an iframe src.
    'video'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type site_article_status as enum (
    'draft',
    'published',
    -- An administrator took it down. Kept rather than deleted, so the decision
    -- is reviewable and so the author is not left wondering where it went.
    'removed'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Series
-- ---------------------------------------------------------------------------
--
-- "Article series" is one line in the brief and it is the cheapest thing in
-- this session: a named group with an order. A series belongs to the club
-- rather than to its creator, so anybody may add to one, which is what makes it
-- a series rather than a personal tag.

create table if not exists site_article_series (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  slug text not null,
  title text not null,
  description text,

  created_by uuid references site_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_article_series_site_slug_uidx
  on site_article_series(site_id, lower(slug));

-- Referenced by the composite foreign key below, which is what stops an article
-- in one club being filed under another club's series.
create unique index if not exists site_article_series_id_site_uidx
  on site_article_series(id, site_id);

drop trigger if exists set_updated_at on site_article_series;
create trigger set_updated_at before update on site_article_series
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Articles
-- ---------------------------------------------------------------------------

create table if not exists site_articles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,

  -- The author is the profile, per the brief. A membership row, not an auth
  -- identity, so an article renders with the name and photo the directory
  -- shows and links to the same page.
  --
  -- Cascade rather than restrict, because sites cascade into site_members and a
  -- restrict here would make deleting a club fail. Erasure on request is a GDPR
  -- surface for session 9, and this is the behaviour it will want anyway.
  author_id uuid not null references site_members(id) on delete cascade,

  kind site_article_kind not null,
  status site_article_status not null default 'draft',

  -- Unique per club, so the URL is /library/<slug> rather than a uuid. Drafts
  -- hold their slug too: an author should not find their URL changed by
  -- somebody else publishing first.
  slug text not null,
  title text not null,
  -- The standfirst. Shown in the library list, so it is the only part of most
  -- articles most members read.
  summary text,

  -- Written articles live here. Audio and video use it for notes, a
  -- transcript, or nothing.
  body text,

  -- Audio only. A path in the member-media bucket, never a URL: reads are
  -- proxied by /api/media under the reader's own session, exactly like photos.
  media_path text,
  media_mime text,
  media_bytes bigint,

  -- Video only. Provider and id, so the iframe src is built rather than
  -- borrowed. Storing the URL the author pasted and putting it in a src would
  -- make an article an arbitrary embed.
  embed_provider text check (embed_provider in ('youtube', 'vimeo')),
  embed_id text,

  series_id uuid,
  series_position int,

  -- Maintained by the triggers in section 5. The author cannot write them.
  total_reads int not null default 0,
  unique_readers int not null default 0,

  published_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references site_members(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A series in the same club, or none. The composite reference is what
  -- enforces it: site_id has to match on both sides.
  --
  -- The column list on SET NULL is not optional. Without it, deleting a series
  -- would try to null every column in the reference, and site_id is NOT NULL,
  -- so the delete would fail instead of unfiling the article. Postgres 15 and
  -- later accept the list; this database is on 17.
  constraint site_articles_series_same_site
    foreign key (series_id, site_id)
    references site_article_series(id, site_id) on delete set null (series_id)
);

create unique index if not exists site_articles_site_slug_uidx
  on site_articles(site_id, lower(slug));

-- The library, which is the query every member runs.
create index if not exists site_articles_published_idx
  on site_articles(site_id, published_at desc) where status = 'published';

-- An author's own list, drafts included.
create index if not exists site_articles_author_idx
  on site_articles(author_id, updated_at desc);

create index if not exists site_articles_series_idx
  on site_articles(series_id, series_position) where series_id is not null;

drop trigger if exists set_updated_at on site_articles;
create trigger set_updated_at before update on site_articles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Reads
-- ---------------------------------------------------------------------------

create table if not exists site_article_reads (
  id uuid primary key default gen_random_uuid(),

  -- Denormalized from the article by the trigger below rather than taken from
  -- the caller, so the tenant policy on this table cannot be fooled by a row
  -- that claims the wrong club.
  site_id uuid not null references sites(id) on delete cascade,
  article_id uuid not null references site_articles(id) on delete cascade,
  member_id uuid not null references site_members(id) on delete cascade,

  read_count int not null default 1,
  first_read_at timestamptz not null default now(),
  last_read_at timestamptz not null default now()
);

-- One row per reader per article. This is what makes unique_readers a count of
-- rows and total_reads a sum, and it is what stops the table becoming a log.
create unique index if not exists site_article_reads_uidx
  on site_article_reads(article_id, member_id);

create index if not exists site_article_reads_member_idx
  on site_article_reads(member_id, last_read_at desc);

-- ---------------------------------------------------------------------------
-- 5. Triggers
-- ---------------------------------------------------------------------------

-- Publication stamps itself.
--
-- published_at is what the library sorts on, so an author being able to set it
-- would let them sit at the top of the list forever. It is written here and
-- ignored from the request in every case.
--
-- The first publication is the one that counts. An article taken back to draft
-- and published again keeps its original date, because that is when the
-- membership first saw it.
create or replace function app.stamp_site_article_publication()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.published_at := case when new.status = 'published' then now() else null end;
    new.removed_at := null;
    new.removed_by := null;
    return new;
  end if;

  -- A read is not an edit. The counter trigger in this file updates the article
  -- row, and letting that move updated_at would reshuffle an author's own list
  -- every time somebody opened one of their pieces.
  if pg_trigger_depth() > 1 then
    new.updated_at := old.updated_at;
  end if;

  new.published_at := old.published_at;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.status = 'removed' and old.status <> 'removed' then
    new.removed_at := now();
    new.removed_by := app.current_site_member_id(new.site_id);
  elsif new.status <> 'removed' then
    new.removed_at := null;
    new.removed_by := null;
  else
    new.removed_at := old.removed_at;
    new.removed_by := old.removed_by;
  end if;

  return new;
end;
$$;

drop trigger if exists stamp_publication on site_articles;
create trigger stamp_publication before insert or update on site_articles
  for each row execute function app.stamp_site_article_publication();

-- What an author may not do to their own article.
--
-- The same shape as app.guard_site_member_self_update in 0013, and for the same
-- reason: row level security decides which rows, and a trigger is the only
-- thing that can decide which columns.
--
-- auth.role() rather than current_user, because inside a SECURITY DEFINER
-- function current_user is the function owner and would match nothing. That was
-- one of the three bugs in section 5 of status.md.
create or replace function app.guard_site_article_author_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- The read counter below updates this table from inside another trigger.
  -- Nothing a member can send directly is nested, because a member cannot
  -- create a trigger, so depth is what tells our own writes apart from theirs.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  -- The service role, which claims memberships and runs the seed.
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if is_staff() or app.is_site_admin(old.site_id) then
    return new;
  end if;

  if new.site_id is distinct from old.site_id
     or new.author_id is distinct from old.author_id then
    raise exception 'An article cannot change its author or its club.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Removal is an administrator's decision. An author who could undo it would
  -- make the decision advisory, and an author who could apply it to somebody
  -- else's article never gets here, because the policy refuses the row first.
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

drop trigger if exists guard_author_update on site_articles;
create trigger guard_author_update before update on site_articles
  for each row execute function app.guard_site_article_author_update();

-- A read is counted, not reported.
--
-- Everything about the row except which article and which member is written
-- here, so read_count is the number of times this actually ran rather than a
-- number the client sent.
create or replace function app.stamp_site_article_read()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_author uuid;
  v_site uuid;
  v_status site_article_status;
begin
  if tg_op = 'INSERT' then
    select a.author_id, a.site_id, a.status
      into v_author, v_site, v_status
      from site_articles a where a.id = new.article_id;

    -- No article, or one nobody is reading yet. Silently drop rather than
    -- raise: a read is telemetry, and telemetry must never break a page.
    if v_author is null or v_status <> 'published' then
      return null;
    end if;

    -- An author reading their own piece is not a reader of it.
    if new.member_id = v_author then
      return null;
    end if;

    new.site_id := v_site;
    new.read_count := 1;
    new.first_read_at := now();
    new.last_read_at := now();
    return new;
  end if;

  -- An update is the second and later visits. The client sends nothing that
  -- survives this.
  new.site_id := old.site_id;
  new.article_id := old.article_id;
  new.member_id := old.member_id;
  new.first_read_at := old.first_read_at;

  if old.last_read_at > now() - interval '30 minutes' then
    -- The same sitting. Reloading a page is not reading it twice, and this is
    -- what keeps the number worth showing.
    new.read_count := old.read_count;
    new.last_read_at := old.last_read_at;
  else
    new.read_count := old.read_count + 1;
    new.last_read_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists stamp_read on site_article_reads;
create trigger stamp_read before insert or update on site_article_reads
  for each row execute function app.stamp_site_article_read();

-- The aggregates the library shows.
--
-- Denormalized onto the article so that counting readers does not require
-- reading the rows that say who they were. That is the whole reason this is not
-- a view: a member seeing "read by 14 members" should not be a member who can
-- ask which fourteen.
create or replace function app.count_site_article_read()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update site_articles
      set unique_readers = unique_readers + 1,
          total_reads = total_reads + 1
      where id = new.article_id;
  elsif new.read_count > old.read_count then
    update site_articles
      set total_reads = total_reads + (new.read_count - old.read_count)
      where id = new.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists count_read on site_article_reads;
create trigger count_read after insert or update on site_article_reads
  for each row execute function app.count_site_article_read();

-- ---------------------------------------------------------------------------
-- 6. Row level security
-- ---------------------------------------------------------------------------

alter table site_article_series enable row level security;
alter table site_articles enable row level security;
alter table site_article_reads enable row level security;

-- Series ---------------------------------------------------------------------

drop policy if exists site_article_series_staff_all on site_article_series;
create policy site_article_series_staff_all on site_article_series
  for all using (is_staff()) with check (is_staff());

drop policy if exists site_article_series_member_read on site_article_series;
create policy site_article_series_member_read on site_article_series
  for select using (app.is_active_site_member(site_id));

-- Any active member may start one. A series is a shelf rather than a
-- publication, and a club where only administrators can name a shelf ends up
-- with no shelves.
drop policy if exists site_article_series_member_write on site_article_series;
create policy site_article_series_member_write on site_article_series
  for insert to authenticated
  with check (
    app.is_active_site_member(site_id)
    and created_by = app.current_site_member_id(site_id)
  );

drop policy if exists site_article_series_own_update on site_article_series;
create policy site_article_series_own_update on site_article_series
  for update to authenticated
  using (created_by = app.current_site_member_id(site_id))
  with check (created_by = app.current_site_member_id(site_id));

drop policy if exists site_article_series_admin_all on site_article_series;
create policy site_article_series_admin_all on site_article_series
  for all using (app.is_site_admin(site_id)) with check (app.is_site_admin(site_id));

-- Articles -------------------------------------------------------------------

drop policy if exists site_articles_staff_all on site_articles;
create policy site_articles_staff_all on site_articles
  for all using (is_staff()) with check (is_staff());

-- The library. Active members of this club, published articles, and nothing
-- else. A draft is invisible, a removed article is invisible, another club's
-- library is invisible, and a lapsed guest is not an active member, so their
-- read access to all of it stops when their window does.
--
-- That last consequence is the answer to the question status.md section 4
-- leaves open, and it is inherited from app.is_active_site_member rather than
-- written again here.
drop policy if exists site_articles_library_read on site_articles;
create policy site_articles_library_read on site_articles
  for select using (
    app.is_active_site_member(site_id)
    and status = 'published'
  );

-- An author always sees their own, at any status, including one an
-- administrator removed. Being told is better than finding a blank page.
drop policy if exists site_articles_author_read on site_articles;
create policy site_articles_author_read on site_articles
  for select using (author_id = app.current_site_member_id(site_id));

-- Writing. Publishing is not a separate right: the moderation decision in build
-- plan section 2 is publish immediately, remove afterwards, because members are
-- already vetted at the door.
drop policy if exists site_articles_author_write on site_articles;
create policy site_articles_author_write on site_articles
  for insert to authenticated
  with check (
    app.is_active_site_member(site_id)
    and author_id = app.current_site_member_id(site_id)
  );

drop policy if exists site_articles_author_update on site_articles;
create policy site_articles_author_update on site_articles
  for update to authenticated
  using (
    app.is_active_site_member(site_id)
    and author_id = app.current_site_member_id(site_id)
  )
  with check (
    app.is_active_site_member(site_id)
    and author_id = app.current_site_member_id(site_id)
  );

-- An author may delete their own work. Not one an administrator removed: that
-- row is the record of a decision, and its subject is not the person who gets
-- to erase it.
drop policy if exists site_articles_author_delete on site_articles;
create policy site_articles_author_delete on site_articles
  for delete to authenticated
  using (
    app.is_active_site_member(site_id)
    and author_id = app.current_site_member_id(site_id)
    and status <> 'removed'
  );

drop policy if exists site_articles_admin_all on site_articles;
create policy site_articles_admin_all on site_articles
  for all using (app.is_site_admin(site_id)) with check (app.is_site_admin(site_id));

-- Reads ----------------------------------------------------------------------

drop policy if exists site_article_reads_staff_all on site_article_reads;
create policy site_article_reads_staff_all on site_article_reads
  for all using (is_staff()) with check (is_staff());

-- A member records their own reading and can see it. Nobody else's, not even an
-- author looking at their own article: the aggregate on the article is what
-- authors get, and it is deliberately not attributable.
drop policy if exists site_article_reads_self on site_article_reads;
create policy site_article_reads_self on site_article_reads
  for select using (member_id = app.current_site_member_id(site_id));

drop policy if exists site_article_reads_self_insert on site_article_reads;
create policy site_article_reads_self_insert on site_article_reads
  for insert to authenticated
  with check (
    app.is_active_site_member(site_id)
    and member_id = app.current_site_member_id(site_id)
  );

-- The upsert the article page runs needs update as well as insert, because the
-- second visit conflicts with the first.
drop policy if exists site_article_reads_self_update on site_article_reads;
create policy site_article_reads_self_update on site_article_reads
  for update to authenticated
  using (member_id = app.current_site_member_id(site_id))
  with check (member_id = app.current_site_member_id(site_id));

-- An administrator can read the rows, which is the surface session 9 turns into
-- analytics and the surface the club's policy has to cover. Nobody else can.
drop policy if exists site_article_reads_admin_read on site_article_reads;
create policy site_article_reads_admin_read on site_article_reads
  for select using (app.is_site_admin(site_id));

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------
--
-- Policies evaluate as the querying role, so the helpers the new policies call
-- need EXECUTE by `authenticated`. 0013 already granted these three; repeated
-- here because a fresh database applying migrations in order gets this file
-- without anyone remembering that it did.

grant execute on function app.current_site_member_id(uuid) to authenticated;
grant execute on function app.is_active_site_member(uuid) to authenticated;
grant execute on function app.is_site_admin(uuid) to authenticated;
