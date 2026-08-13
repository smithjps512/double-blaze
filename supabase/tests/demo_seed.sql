-- Behavioural test for the demo seed's three defences (0024).
--
-- Run like the others: paste into the SQL editor or send through
-- `apply_migration`. It ends in a deliberate `raise exception`, so the whole
-- transaction rolls back and the demo content it purges comes straight back.
--
-- Expect every line to read PASS.
--
-- ---------------------------------------------------------------------------
-- Why this one is not optional
-- ---------------------------------------------------------------------------
--
-- Unlike the other four suites, this one runs against the real Electric Grid
-- site and the real seeded rows rather than building its own fixtures. That is
-- deliberate: what is being tested is that THIS club cannot go live while THESE
-- rows are in it, and a test that built its own club would prove something
-- adjacent to that rather than that.
--
-- It expects the seed in supabase/seed/electric_grid_demo.sql to have been run:
-- six members, six articles, one series. Change those numbers here if the seed
-- grows in session 6 or 7, which it will, because reactions and events need
-- something to attach to.
--
-- The rollback is what makes running this against live data safe. It purges
-- everything and publishes the site, and then none of it happened.

do $$
declare
  v_site uuid;
  v_log text := '';
  v_a int; v_s int; v_m int; v_media text[];
  v_n int;
begin
  select id into v_site from sites where slug = 'electricgrid';
  if v_site is null then
    raise exception 'No site with slug electricgrid. Nothing to test.';
  end if;

  -- 1. The whole point. A console can warn and a warning is what somebody
  --    clicks past at the end of a long day, so the database refuses.
  begin
    update sites set status = 'published' where id = v_site;
    v_log := v_log || E'\n  FAIL a site with demo content was published';
  exception when others then
    v_log := v_log || E'\n  PASS publishing is refused: ' || left(sqlerrm, 90);
  end;

  -- 2. And refuses nothing else. A guard that blocks moving a site back to
  --    draft would be a guard somebody disables.
  begin
    update sites set status = 'preview' where id = v_site;
    v_log := v_log || E'\n  PASS the guard only blocks publication';
    update sites set status = 'draft' where id = v_site;
  exception when others then
    v_log := v_log || E'\n  FAIL the guard blocked an unrelated status change: ' || sqlerrm;
  end;

  -- 3. One call takes all of it, in dependency order, and says what it took.
  select removed_articles, removed_series, removed_members, orphaned_media
    into v_a, v_s, v_m, v_media
    from app.purge_site_demo_rows(v_site);

  v_log := v_log || case when v_a = 6 and v_s = 1 and v_m = 6
    then E'\n  PASS the purge removed 6 articles, 1 series, 6 members'
    else E'\n  FAIL the purge removed ' || v_a || ' articles, ' || v_s || ' series, ' || v_m || ' members' end;

  -- Storage is the one thing the purge cannot finish, so it reports rather than
  -- pretending. Zero until somebody attaches a recording to the demo audio
  -- piece at the session 5 gate, and one after that.
  v_log := v_log || E'\n  NOTE orphaned media paths reported: ' || coalesce(array_length(v_media, 1), 0);

  -- 4. The flag is what separates invented people from real ones, so a purge
  --    that took a real member with it would be worse than no purge at all.
  select count(*) into v_n from site_members where site_id = v_site;
  v_log := v_log || case when v_n = 1
    then E'\n  PASS the purge left the real membership alone'
    else E'\n  FAIL ' || v_n || ' members remain, expected 1' end;

  -- 5. And the guard lets go once there is nothing left to hide.
  begin
    update sites set status = 'published' where id = v_site;
    v_log := v_log || E'\n  PASS publication is allowed once the demo content is gone';
  exception when others then
    v_log := v_log || E'\n  FAIL publication still refused: ' || sqlerrm;
  end;

  raise exception E'DEMO GUARD TEST RESULTS:%', v_log;
end $$;
