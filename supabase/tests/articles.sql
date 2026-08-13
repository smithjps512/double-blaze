-- Behavioural test for articles, the library, and reading counts (session 5).
--
-- Run like the others: paste into the SQL editor or send through
-- `apply_migration`. It ends in a deliberate `raise exception` carrying the
-- results, so the transaction rolls back and leaves no sites, members,
-- articles, or reads behind.
--
-- Expect every line to read PASS.
--
-- ---------------------------------------------------------------------------
-- What this suite is for
-- ---------------------------------------------------------------------------
--
-- 0023 puts four separate things in the database rather than in the
-- application, and each one is invisible to a unit test:
--
--   1. The library is a policy. A draft, another club's article, and an
--      article an administrator removed are all absent from a member's result
--      set rather than filtered out of it.
--   2. Removal is an administrator's decision, and the guard trigger is what
--      stops the author undoing it. A trigger is not bypassed by anything,
--      including the service role, which is the lesson from section 5 of
--      status.md.
--   3. The reader counts are written by triggers. The author cannot set them,
--      a reload inside half an hour is one read, and an author reading their
--      own piece is not a reader of it.
--   4. A lapsed guest keeps nothing. That was the open question in section 4
--      of status.md and it is answered here rather than reasoned about.
--
-- Two clubs are built, so the multi-tenant claim is tested rather than assumed.

do $$
declare
  v_site_a uuid; v_site_b uuid;

  v_admin uuid := '00000000-0000-4000-8000-000000000501';
  v_author uuid := '00000000-0000-4000-8000-000000000502';
  v_reader uuid := '00000000-0000-4000-8000-000000000503';
  v_guest uuid := '00000000-0000-4000-8000-000000000504';
  v_bmember uuid := '00000000-0000-4000-8000-000000000505';

  v_admin_row uuid; v_author_row uuid; v_reader_row uuid;
  v_guest_row uuid; v_bmember_row uuid;

  v_article uuid; v_draft uuid; v_series_b uuid;
  v_published_at timestamptz;

  v_log text := ''; v_n int; v_total int; v_unique int;
begin
  -- -------------------------------------------------------------------------
  -- Two clubs, five people
  -- -------------------------------------------------------------------------

  insert into sites (slug, name) values ('test-club-a','Test Club A') returning id into v_site_a;
  insert into sites (slug, name) values ('test-club-b','Test Club B') returning id into v_site_b;

  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
    (v_admin,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@example.test',now(),now()),
    (v_author,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','author@example.test',now(),now()),
    (v_reader,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','reader@example.test',now(),now()),
    (v_guest,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','guest@example.test',now(),now()),
    (v_bmember,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','bmember@example.test',now(),now());

  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_admin, 'admin@example.test','admin','active') returning id into v_admin_row;
  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_author, 'author@example.test','member','active') returning id into v_author_row;
  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_reader, 'reader@example.test','member','active') returning id into v_reader_row;

  -- A guest whose window closed yesterday. Still 'active', which is the point:
  -- the expiry is what app.is_active_site_member enforces, not the status.
  insert into site_members (site_id, auth_user_id, email, role, status, access_expires_at)
  values (v_site_a, v_guest, 'guest@example.test','guest','active', now() - interval '1 day')
  returning id into v_guest_row;

  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_b, v_bmember, 'bmember@example.test','member','active') returning id into v_bmember_row;

  insert into site_article_series (site_id, slug, title, created_by)
  values (v_site_b, 'club-b-series', 'A series in the other club', v_bmember_row)
  returning id into v_series_b;

  -- -------------------------------------------------------------------------
  -- Writing
  -- -------------------------------------------------------------------------

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_author, 'role','authenticated','email','author@example.test')::text, true);

  -- 1. An author writes their own piece.
  begin
    insert into site_articles (site_id, author_id, kind, slug, title, body)
    values (v_site_a, v_author_row, 'written', 'load-growth', 'Load growth', 'Words.')
    returning id into v_article;
    v_log := v_log || E'\n  PASS a member can write their own piece';
  exception when others then
    v_log := v_log || E'\n  FAIL own write refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 2. And a second one that stays a draft, used further down.
  insert into site_articles (site_id, author_id, kind, slug, title, body)
  values (v_site_a, v_author_row, 'written', 'still-thinking', 'Still thinking', 'Notes.')
  returning id into v_draft;

  -- 3. Publishing under somebody else's name. This is the one that would let a
  --    member put words in a colleague's mouth.
  begin
    insert into site_articles (site_id, author_id, kind, slug, title)
    values (v_site_a, v_reader_row, 'written', 'not-mine', 'Not mine');
    v_log := v_log || E'\n  FAIL a member published under another member''s name';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS a member cannot publish under another member''s name';
  end;

  -- 4. Writing into another club.
  begin
    insert into site_articles (site_id, author_id, kind, slug, title)
    values (v_site_b, v_author_row, 'written', 'wrong-club', 'Wrong club');
    v_log := v_log || E'\n  FAIL a member wrote into another club';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS a member cannot write into another club';
  end;

  -- 5. Filing a piece under a series that belongs to the other club. The
  --    composite foreign key in 0023 is what refuses this.
  begin
    update site_articles set series_id = v_series_b where id = v_article;
    v_log := v_log || E'\n  FAIL an article was filed under another club''s series';
  exception when foreign_key_violation then
    v_log := v_log || E'\n  PASS an article cannot be filed under another club''s series';
  end;

  -- 6. Publishing stamps its own date, and the author cannot choose it.
  --    published_at is what the library sorts on, so an author who could set it
  --    would sit at the top of the list forever.
  update site_articles
    set status = 'published', published_at = timestamptz '2000-01-01 00:00:00Z'
    where id = v_article;
  select published_at into v_published_at from site_articles where id = v_article;
  v_log := v_log || case when v_published_at > now() - interval '1 minute'
    then E'\n  PASS publication stamps its own date'
    else E'\n  FAIL the author set published_at to ' || v_published_at end;

  -- -------------------------------------------------------------------------
  -- Reading
  -- -------------------------------------------------------------------------

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_reader, 'role','authenticated','email','reader@example.test')::text, true);

  -- 7. A member sees what the club published.
  select count(*) into v_n from site_articles where id = v_article;
  v_log := v_log || case when v_n = 1
    then E'\n  PASS a member can read a published piece'
    else E'\n  FAIL a member saw ' || v_n || ' published pieces' end;

  -- 8. But not somebody else's draft.
  select count(*) into v_n from site_articles where id = v_draft;
  v_log := v_log || case when v_n = 0
    then E'\n  PASS a member cannot see another member''s draft'
    else E'\n  FAIL a member saw another member''s draft' end;

  -- 9. Reading it counts once.
  insert into site_article_reads (site_id, article_id, member_id)
  values (v_site_a, v_article, v_reader_row)
  on conflict (article_id, member_id) do update set site_id = excluded.site_id;

  select total_reads, unique_readers into v_total, v_unique from site_articles where id = v_article;
  v_log := v_log || case when v_total = 1 and v_unique = 1
    then E'\n  PASS a read counts once'
    else E'\n  FAIL after one read the counts were ' || v_total || ' and ' || v_unique end;

  -- 10. Reloading straight away is the same read. This is what makes the
  --     number worth showing, and what makes inflating it tedious.
  insert into site_article_reads (site_id, article_id, member_id)
  values (v_site_a, v_article, v_reader_row)
  on conflict (article_id, member_id) do update set site_id = excluded.site_id;

  select total_reads, unique_readers into v_total, v_unique from site_articles where id = v_article;
  v_log := v_log || case when v_total = 1 and v_unique = 1
    then E'\n  PASS a reload inside the window is the same read'
    else E'\n  FAIL a reload took the counts to ' || v_total || ' and ' || v_unique end;

  -- 11. Coming back later is a second read, and still one reader.
  --     The trigger owns last_read_at, so backdating it means turning the
  --     trigger off for one statement rather than sending a value it would
  --     overwrite. This is a test fixture, not something the application does.
  reset role;
  perform set_config('request.jwt.claims','',true);
  alter table site_article_reads disable trigger stamp_read;
  update site_article_reads set last_read_at = now() - interval '2 hours'
    where article_id = v_article and member_id = v_reader_row;
  alter table site_article_reads enable trigger stamp_read;

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_reader, 'role','authenticated','email','reader@example.test')::text, true);

  insert into site_article_reads (site_id, article_id, member_id)
  values (v_site_a, v_article, v_reader_row)
  on conflict (article_id, member_id) do update set site_id = excluded.site_id;

  select total_reads, unique_readers into v_total, v_unique from site_articles where id = v_article;
  v_log := v_log || case when v_total = 2 and v_unique = 1
    then E'\n  PASS coming back later is a second read by the same reader'
    else E'\n  FAIL a later visit took the counts to ' || v_total || ' and ' || v_unique end;

  -- 12. A member cannot record a read for somebody else.
  begin
    insert into site_article_reads (site_id, article_id, member_id)
    values (v_site_a, v_article, v_admin_row);
    v_log := v_log || E'\n  FAIL a member recorded a read for somebody else';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS a member cannot record a read for somebody else';
  end;

  -- -------------------------------------------------------------------------
  -- What the author can and cannot see or do
  -- -------------------------------------------------------------------------

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_author, 'role','authenticated','email','author@example.test')::text, true);

  -- 13. An author reading their own piece is not a reader of it.
  insert into site_article_reads (site_id, article_id, member_id)
  values (v_site_a, v_article, v_author_row)
  on conflict (article_id, member_id) do update set site_id = excluded.site_id;

  select total_reads, unique_readers into v_total, v_unique from site_articles where id = v_article;
  v_log := v_log || case when v_total = 2 and v_unique = 1
    then E'\n  PASS an author reading their own piece is not counted'
    else E'\n  FAIL the author''s own read took the counts to ' || v_total || ' and ' || v_unique end;

  -- 14. An author sees the number and never the names. This is the whole reason
  --     the counts are columns on the article rather than a view over the rows.
  select count(*) into v_n from site_article_reads where article_id = v_article;
  v_log := v_log || case when v_n = 0
    then E'\n  PASS an author cannot see who read their piece'
    else E'\n  FAIL an author saw ' || v_n || ' reader rows' end;

  -- 15. And cannot write the counts.
  begin
    update site_articles set total_reads = 500 where id = v_article;
    v_log := v_log || E'\n  FAIL an author set their own reader count';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an author cannot set their own reader count';
  end;

  -- 16. Nor mark anything removed, including their own. Removal is what an
  --     administrator did, and a status only they can set is what keeps the two
  --     apart from an author simply unpublishing.
  begin
    update site_articles set status = 'removed' where id = v_article;
    v_log := v_log || E'\n  FAIL an author set the removed status, which is an administrator''s';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an author cannot mark a piece removed';
  end;

  -- -------------------------------------------------------------------------
  -- Another club, and a lapsed guest
  -- -------------------------------------------------------------------------

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_bmember, 'role','authenticated','email','bmember@example.test')::text, true);

  -- 17. The tenant boundary, which is the entire commercial case for one
  --     deployment serving every club.
  select count(*) into v_n from site_articles where site_id = v_site_a;
  v_log := v_log || case when v_n = 0
    then E'\n  PASS a member of one club reads nothing in another'
    else E'\n  FAIL a member of club B read ' || v_n || ' of club A''s pieces' end;

  -- 18. And cannot record a read against it either.
  begin
    insert into site_article_reads (site_id, article_id, member_id)
    values (v_site_b, v_article, v_bmember_row);
    v_log := v_log || E'\n  FAIL a member of club B recorded a read in club A';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS a member of one club cannot record a read in another';
  end;

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_guest, 'role','authenticated','email','guest@example.test')::text, true);

  -- 19. The question status.md section 4 left open: does a lapsed guest keep
  --     read access to the library? No, and it is inherited from
  --     app.is_active_site_member rather than decided again anywhere.
  select count(*) into v_n from site_articles;
  v_log := v_log || case when v_n = 0
    then E'\n  PASS a guest whose window has closed reads nothing in the library'
    else E'\n  FAIL a lapsed guest read ' || v_n || ' pieces' end;

  -- 20. And a signed-out visitor reads nothing at all, which is what "gated"
  --     has to mean for a club whose premise is that its inside is not public.
  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role anon;
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  begin
    select count(*) into v_n from site_articles;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS an anonymous visitor reads nothing'
      else E'\n  FAIL an anonymous visitor read ' || v_n || ' pieces' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an anonymous visitor reads nothing';
  end;

  -- -------------------------------------------------------------------------
  -- Removal, and who can undo it
  -- -------------------------------------------------------------------------

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role','authenticated','email','admin@example.test')::text, true);

  -- 21. An administrator takes it down, and the row records who and when.
  update site_articles set status = 'removed' where id = v_article;
  get diagnostics v_n = row_count;
  select count(*) into v_n from site_articles
    where id = v_article and status = 'removed' and removed_by = v_admin_row and removed_at is not null;
  v_log := v_log || case when v_n = 1
    then E'\n  PASS an administrator can remove a piece, and it records who did'
    else E'\n  FAIL removal did not record the administrator' end;

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_reader, 'role','authenticated','email','reader@example.test')::text, true);

  -- 22. It leaves the library at once.
  select count(*) into v_n from site_articles where id = v_article;
  v_log := v_log || case when v_n = 0
    then E'\n  PASS a removed piece leaves the library'
    else E'\n  FAIL a removed piece was still readable' end;

  reset role;
  perform set_config('request.jwt.claims','',true);
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_author, 'role','authenticated','email','author@example.test')::text, true);

  -- 23. The author still sees it, because being told beats a blank page.
  select count(*) into v_n from site_articles where id = v_article;
  v_log := v_log || case when v_n = 1
    then E'\n  PASS the author can still see a piece that was removed'
    else E'\n  FAIL the author lost sight of their own removed piece' end;

  -- 24. And cannot put it back. An author who could undo removal would make the
  --     administrator's decision advisory.
  begin
    update site_articles set status = 'published' where id = v_article;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS the author cannot restore a removed piece'
      else E'\n  FAIL the author republished a removed piece' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS the author cannot restore a removed piece';
  end;

  -- 25. Nor delete it. That row is the record of a decision, and its subject is
  --     not the person who gets to erase it.
  delete from site_articles where id = v_article;
  get diagnostics v_n = row_count;
  v_log := v_log || case when v_n = 0
    then E'\n  PASS the author cannot delete a removed piece'
    else E'\n  FAIL the author deleted a removed piece' end;

  -- 26. Their own draft is theirs to delete, though.
  delete from site_articles where id = v_draft;
  get diagnostics v_n = row_count;
  v_log := v_log || case when v_n = 1
    then E'\n  PASS an author can delete their own draft'
    else E'\n  FAIL an author could not delete their own draft' end;

  reset role;
  perform set_config('request.jwt.claims','',true);
  raise exception E'ARTICLE TEST RESULTS:%', v_log;
end $$;
