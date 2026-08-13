-- Behavioural test for invitations (session 3e).
--
-- Same shape as the other two suites: paste it into the SQL editor or send it
-- through `apply_migration`. It ends in a deliberate `raise exception` carrying
-- the results, so the transaction rolls back and leaves nothing behind.
--
-- Expect every line to read PASS.
--
-- ---------------------------------------------------------------------------
-- What it is testing
-- ---------------------------------------------------------------------------
--
-- The invitation table is the one place in the build where a credential lives
-- in the database, so the questions here are different from the other suites.
-- Not "may this person do that" but "can this table be read by anyone who
-- should not read it", because an invitation that leaks is a membership that
-- leaks, and the redemption route runs as the service role where no policy is
-- consulted at all.
--
-- The one-open-invitation index from 0021 is tested because an administrator
-- who revokes an invitation has every reason to believe the invitation is
-- revoked, and a second live token for the same address would make that false.

do $$
declare
  v_site_a uuid;
  v_site_b uuid;
  v_admin_a uuid := '00000000-0000-4000-8000-0000000003e1';
  v_member_a uuid := '00000000-0000-4000-8000-0000000003e2';
  v_admin_b uuid := '00000000-0000-4000-8000-0000000003e3';
  v_admin_a_row uuid;
  v_member_a_row uuid;
  v_invite_a uuid;
  v_log text := '';
  v_n int;
begin
  insert into sites (slug, name) values ('test-club-a', 'Test Club A') returning id into v_site_a;
  insert into sites (slug, name) values ('test-club-b', 'Test Club B') returning id into v_site_b;

  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  values
    (v_admin_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.a@example.test', now(), now()),
    (v_member_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'member.a@example.test', now(), now()),
    (v_admin_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.b@example.test', now(), now());

  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_admin_a, 'admin.a@example.test', 'admin', 'active')
  returning id into v_admin_a_row;

  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_a, v_member_a, 'member.a@example.test', 'member', 'active')
  returning id into v_member_a_row;

  insert into site_members (site_id, auth_user_id, email, role, status)
  values (v_site_b, v_admin_b, 'admin.b@example.test', 'admin', 'active');

  -- =========================================================================
  -- As club A's administrator
  -- =========================================================================
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a, 'role', 'authenticated',
                      'email', 'admin.a@example.test')::text, true);

  -- 1. Issuing one.
  begin
    insert into site_invitations (site_id, email, role, token_hash, invited_by, expires_at)
    values (v_site_a, 'invitee@example.test', 'member', repeat('a', 64), v_admin_a_row,
            now() + interval '14 days')
    returning id into v_invite_a;
    v_log := v_log || E'\n  PASS administrator can issue an invitation';
  exception when others then
    v_log := v_log || E'\n  FAIL issuing refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 2. A second open invitation to the same address must not exist, or a
  --    revoke would leave a live token behind.
  begin
    insert into site_invitations (site_id, email, role, token_hash, invited_by, expires_at)
    values (v_site_a, 'invitee@example.test', 'member', repeat('b', 64), v_admin_a_row,
            now() + interval '14 days');
    v_log := v_log || E'\n  FAIL a second open invitation to the same address was accepted';
  exception when unique_violation then
    v_log := v_log || E'\n  PASS only one open invitation per address';
  end;

  -- 3. Case must not defeat it, since site_members keys on lower(email) too.
  begin
    insert into site_invitations (site_id, email, role, token_hash, invited_by, expires_at)
    values (v_site_a, 'INVITEE@example.test', 'member', repeat('c', 64), v_admin_a_row,
            now() + interval '14 days');
    v_log := v_log || E'\n  FAIL a capital letter created a second open invitation';
  exception when unique_violation then
    v_log := v_log || E'\n  PASS capitalisation does not defeat the index';
  end;

  -- 4. Revoke, then reissue. This is what the route does, and it has to work.
  begin
    update site_invitations set revoked_at = now() where id = v_invite_a;
    insert into site_invitations (site_id, email, role, token_hash, invited_by, expires_at)
    values (v_site_a, 'invitee@example.test', 'member', repeat('d', 64), v_admin_a_row,
            now() + interval '14 days');
    v_log := v_log || E'\n  PASS revoking frees the address to be invited again';
  exception when others then
    v_log := v_log || E'\n  FAIL reissue after revoke refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 5. A guest invitation carries an access window separate from its own.
  begin
    insert into site_invitations
      (site_id, email, role, token_hash, invited_by, expires_at, access_expires_at)
    values (v_site_a, 'speaker@example.test', 'guest', repeat('e', 64), v_admin_a_row,
            now() + interval '14 days', now() + interval '90 days');
    v_log := v_log || E'\n  PASS a guest invitation carries its own access window';
  exception when others then
    v_log := v_log || E'\n  FAIL guest invitation refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- =========================================================================
  -- As an ordinary member of club A. Invitations are a credential.
  -- =========================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_member_a, 'role', 'authenticated',
                      'email', 'member.a@example.test')::text, true);

  -- 6. The hashes must not be readable. A member who can read token_hash can
  --    tell whether a given token is live, and can see who is being courted.
  begin
    select count(*) into v_n from site_invitations where site_id = v_site_a;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS an ordinary member cannot read invitations'
      else E'\n  FAIL an ordinary member read ' || v_n || ' invitations' end;
  end;

  -- 7. Nor issue one, which would be self-service membership for their friends.
  begin
    insert into site_invitations (site_id, email, role, token_hash, invited_by, expires_at)
    values (v_site_a, 'friend@example.test', 'member', repeat('f', 64), v_member_a_row,
            now() + interval '14 days');
    v_log := v_log || E'\n  FAIL an ordinary member issued an invitation';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an ordinary member cannot issue invitations';
  end;

  -- =========================================================================
  -- As club B's administrator. The tenant boundary, again.
  -- =========================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin_b, 'role', 'authenticated',
                      'email', 'admin.b@example.test')::text, true);

  -- 8. Another club's invitations are not theirs to see.
  begin
    select count(*) into v_n from site_invitations where site_id = v_site_a;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS another club''s administrator cannot read our invitations'
      else E'\n  FAIL another club''s administrator read ' || v_n || ' of our invitations' end;
  end;

  -- 9. Nor to revoke, which would be a way to quietly block a rival's growth.
  begin
    update site_invitations set revoked_at = now() where site_id = v_site_a;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS another club''s administrator cannot revoke ours'
      else E'\n  FAIL another club''s administrator revoked ' || v_n || ' of ours' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS another club''s administrator cannot revoke ours';
  end;

  -- 10. Nor issue an invitation into our club.
  begin
    insert into site_invitations (site_id, email, role, token_hash, invited_by, expires_at)
    values (v_site_a, 'theirs@example.test', 'admin', repeat('0', 64), null,
            now() + interval '14 days');
    v_log := v_log || E'\n  FAIL another club''s administrator invited into ours';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS another club''s administrator cannot invite into ours';
  end;

  -- =========================================================================
  -- Anonymous. The redemption route runs as the service role precisely because
  -- this has to be true.
  -- =========================================================================
  reset role;
  set local role anon;
  perform set_config('request.jwt.claims',
    json_build_object('role', 'anon')::text, true);

  begin
    select count(*) into v_n from site_invitations;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS an anonymous visitor cannot read invitations'
      else E'\n  FAIL an anonymous visitor read ' || v_n || ' invitations' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an anonymous visitor cannot read invitations';
  end;

  begin
    select count(*) into v_n from site_members;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS an anonymous visitor cannot read the membership'
      else E'\n  FAIL an anonymous visitor read ' || v_n || ' members' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS an anonymous visitor cannot read the membership';
  end;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  raise exception E'INVITATION TEST RESULTS:%', v_log;
end $$;
