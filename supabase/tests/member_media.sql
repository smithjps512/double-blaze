-- Behavioural test for member media storage (session 4).
--
-- Run like the others: paste into the SQL editor or send through
-- `apply_migration`. It ends in a deliberate `raise exception` carrying the
-- results, so the transaction rolls back and leaves no sites, members, or
-- storage rows behind.
--
-- Expect every line to read PASS.
--
-- ---------------------------------------------------------------------------
-- Why storage gets its own suite
-- ---------------------------------------------------------------------------
--
-- In 0022 the object path IS the security model. Both write policies key on
-- `(storage.foldername(name))[1]` and `[2]`, meaning site and member, so a
-- mistake there is not a subtle privilege bug: it is one member overwriting
-- another's photo, or one club writing into another's prefix.
--
-- Nothing in the application can compensate for that, because the bucket is
-- reachable directly with a member's own access token. So it is tested as the
-- database sees it, with the application nowhere in the picture.
--
-- Note the suspended-member check. Reads key on `app.is_active_site_member`,
-- which is the same predicate that expires a guest, so this also covers what
-- happens to a lapsed guest's access to media: it stops. That is the answer
-- recorded in section 4 of status.md, verified rather than assumed.

do $$
declare
  v_site_a uuid; v_site_b uuid;
  v_m1 uuid := '00000000-0000-4000-8000-000000000401';
  v_m2 uuid := '00000000-0000-4000-8000-000000000402';
  v_b1 uuid := '00000000-0000-4000-8000-000000000403';
  v_m1_row uuid; v_m2_row uuid; v_b1_row uuid;
  v_log text := ''; v_n int;
begin
  insert into sites (slug, name) values ('test-club-a','Test Club A') returning id into v_site_a;
  insert into sites (slug, name) values ('test-club-b','Test Club B') returning id into v_site_b;

  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
    (v_m1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','m1@example.test',now(),now()),
    (v_m2,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','m2@example.test',now(),now()),
    (v_b1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','b1@example.test',now(),now());

  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_m1, 'm1@example.test','member','active') returning id into v_m1_row;
  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_m2, 'm2@example.test','member','active') returning id into v_m2_row;
  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_b, v_b1, 'b1@example.test','member','active') returning id into v_b1_row;

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_m1, 'role','authenticated','email','m1@example.test')::text, true);

  -- 1. Writing into your own folder, which is what the upload route does.
  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('member-media', v_site_a || '/' || v_m1_row || '/photo.jpg', v_m1, '{}'::jsonb);
    v_log := v_log || E'\n  PASS member can write into their own folder';
  exception when others then
    v_log := v_log || E'\n  FAIL own write refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 2. Into another member's folder. This is the overwrite-somebody's-photo case.
  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('member-media', v_site_a || '/' || v_m2_row || '/evil.jpg', v_m1, '{}'::jsonb);
    v_log := v_log || E'\n  FAIL member wrote into another member''s folder';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS member cannot write into another member''s folder';
  end;

  -- 3. Into another club. The tenant boundary, at the storage layer.
  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('member-media', v_site_b || '/' || v_b1_row || '/evil.jpg', v_m1, '{}'::jsonb);
    v_log := v_log || E'\n  FAIL member wrote into another club''s folder';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS member cannot write into another club''s folder';
  end;

  -- 4. Reading a club-mate's photo, which is what the directory needs.
  reset role;
  perform set_config('request.jwt.claims','',true);
  insert into storage.objects (bucket_id, name, owner, metadata)
  values ('member-media', v_site_a || '/' || v_m2_row || '/theirs.jpg', v_m2, '{}'::jsonb);
  insert into storage.objects (bucket_id, name, owner, metadata)
  values ('member-media', v_site_b || '/' || v_b1_row || '/theirs.jpg', v_b1, '{}'::jsonb);

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_m1, 'role','authenticated','email','m1@example.test')::text, true);
  begin
    select count(*) into v_n from storage.objects
    where bucket_id='member-media' and name like v_site_a || '/%';
    v_log := v_log || case when v_n >= 2
      then E'\n  PASS member can read their own club''s media'
      else E'\n  FAIL member saw only ' || v_n || ' of their club''s files' end;
  end;

  -- 5. But not another club's.
  begin
    select count(*) into v_n from storage.objects
    where bucket_id='member-media' and name like v_site_b || '/%';
    v_log := v_log || case when v_n = 0
      then E'\n  PASS member cannot read another club''s media'
      else E'\n  FAIL member read ' || v_n || ' of another club''s files' end;
  end;

  -- 6. Deleting somebody else's file.
  begin
    delete from storage.objects
    where bucket_id='member-media' and name = v_site_a || '/' || v_m2_row || '/theirs.jpg';
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS member cannot delete another member''s file'
      else E'\n  FAIL member deleted ' || v_n || ' of another member''s files' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS member cannot delete another member''s file';
  end;

  -- 7. Access keys on is_active_site_member, the same predicate that expires a
  --    guest, so this is also the answer to what a lapsed guest can still read.
  reset role;
  perform set_config('request.jwt.claims','',true);
  update site_members set status='suspended' where id=v_m1_row;
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_m1, 'role','authenticated','email','m1@example.test')::text, true);
  begin
    select count(*) into v_n from storage.objects where bucket_id='member-media';
    v_log := v_log || case when v_n = 0
      then E'\n  PASS a member who is not active reads no media at all'
      else E'\n  FAIL an inactive member read ' || v_n || ' files' end;
  end;

  -- 8. And the bucket is private, so nothing leaks to a signed-out visitor.
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  begin
    select count(*) into v_n from storage.objects where bucket_id='member-media';
    v_log := v_log || case when v_n = 0
      then E'\n  PASS an anonymous visitor reads no media'
      else E'\n  FAIL an anonymous visitor read ' || v_n || ' files' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an anonymous visitor reads no media';
  end;

  reset role;
  perform set_config('request.jwt.claims','',true);
  raise exception E'MEMBER MEDIA TEST RESULTS:%', v_log;
end $$;
