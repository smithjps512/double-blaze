-- Behavioural test for the approval queue's database rules (session 3d).
--
-- Run it exactly like `join_policy.sql`: paste the whole file into the Supabase
-- SQL editor, or send it through `apply_migration`. It ends in a deliberate
-- `raise exception` carrying the results, so the transaction rolls back and it
-- leaves no sites, no members, and no auth identities behind. A run that
-- reports results is a run that cleaned up after itself.
--
-- Expect every line to read PASS.
--
-- ---------------------------------------------------------------------------
-- What it is testing, and why each one is here
-- ---------------------------------------------------------------------------
--
-- The approval queue writes through the administrator's own session, so
-- `site_members_admin_all` is the only thing standing between one club's
-- administrator and another club's membership. The whole commercial case for
-- `apps/members` is that a second club is configuration rather than a
-- deployment, which means that policy is load bearing in a way no amount of
-- careful application code can compensate for. It is tested here with two real
-- sites rather than reasoned about.
--
-- The last-administrator guard from 0019 is tested in both directions. A guard
-- that blocks the wrong thing is as broken as one that permits it, and this
-- build has already been bitten by exactly that: migration 0016 exists because
-- the privilege guard blocked a legitimate claim.

do $$
declare
  v_site_a uuid;
  v_site_b uuid;
  v_admin_a uuid := '00000000-0000-4000-8000-0000000003d1';
  v_member_a uuid := '00000000-0000-4000-8000-0000000003d2';
  v_applicant uuid := '00000000-0000-4000-8000-0000000003d3';
  v_admin_b uuid := '00000000-0000-4000-8000-0000000003d4';
  v_admin_a_row uuid;
  v_member_a_row uuid;
  v_applicant_row uuid;
  v_admin_b_row uuid;
  v_log text := '';
  v_n int;
  v_status text;
  v_role text;
begin
  -- Two clubs, neither of them the real one, so nothing here can touch
  -- Electric Grid's data even in the moments before the rollback.
  insert into sites (slug, name) values ('test-club-a', 'Test Club A') returning id into v_site_a;
  insert into sites (slug, name) values ('test-club-b', 'Test Club B') returning id into v_site_b;

  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  values
    (v_admin_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.a@example.test', now(), now()),
    (v_member_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'member.a@example.test', now(), now()),
    (v_applicant, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'applicant.a@example.test', now(), now()),
    (v_admin_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin.b@example.test', now(), now());

  insert into site_members (site_id, auth_user_id, email, display_name, role, status)
  values (v_site_a, v_admin_a, 'admin.a@example.test', 'Admin A', 'admin', 'active')
  returning id into v_admin_a_row;

  insert into site_members (site_id, auth_user_id, email, display_name, role, status)
  values (v_site_a, v_member_a, 'member.a@example.test', 'Member A', 'member', 'active')
  returning id into v_member_a_row;

  insert into site_members (site_id, auth_user_id, email, display_name, role, status, join_answers)
  values (v_site_a, v_applicant, 'applicant.a@example.test', 'Applicant A', 'member', 'pending',
          '{"employer":"Cascade Power Authority","industry":"grid"}'::jsonb)
  returning id into v_applicant_row;

  insert into site_members (site_id, auth_user_id, email, display_name, role, status)
  values (v_site_b, v_admin_b, 'admin.b@example.test', 'Admin B', 'admin', 'active')
  returning id into v_admin_b_row;

  -- =========================================================================
  -- As club A's administrator
  -- =========================================================================
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin_a, 'role', 'authenticated',
                      'email', 'admin.a@example.test')::text, true);

  -- 1. The queue query itself: the pending applicant must be visible.
  begin
    select count(*) into v_n from site_members
    where site_id = v_site_a and status = 'pending';
    v_log := v_log || case when v_n = 1
      then E'\n  PASS administrator sees the pending request'
      else E'\n  FAIL administrator sees ' || v_n || ' pending requests, expected 1' end;
  exception when others then
    v_log := v_log || E'\n  FAIL queue read errored (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 2. Approving.
  begin
    update site_members
      set status = 'active', approved_by = v_admin_a_row, approved_at = now()
    where id = v_applicant_row;
    get diagnostics v_n = row_count;
    select status into v_status from site_members where id = v_applicant_row;
    v_log := v_log || case when v_n = 1 and v_status = 'active'
      then E'\n  PASS administrator can approve an applicant'
      else E'\n  FAIL approval changed ' || v_n || ' rows, status is ' || coalesce(v_status, 'null') end;
  exception when others then
    v_log := v_log || E'\n  FAIL approval refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 3. The last-administrator guard, in the direction that must block.
  begin
    update site_members set role = 'member' where id = v_admin_a_row;
    v_log := v_log || E'\n  FAIL last administrator stepped down and locked the club out';
  exception when restrict_violation then
    v_log := v_log || E'\n  PASS last administrator cannot step down';
  when others then
    v_log := v_log || E'\n  ???? last-admin change refused with ' || sqlstate;
  end;

  -- 4. Same guard, via status rather than role. Suspension is session 9, but
  --    the guard has to cover the column now rather than when it is used.
  begin
    update site_members set status = 'suspended' where id = v_admin_a_row;
    v_log := v_log || E'\n  FAIL last administrator suspended themselves';
  exception when restrict_violation then
    v_log := v_log || E'\n  PASS last administrator cannot be suspended either';
  when others then
    v_log := v_log || E'\n  ???? last-admin suspend refused with ' || sqlstate;
  end;

  -- 5. The handover: appoint, then step back. This is what session 3d is for,
  --    and it has to work.
  begin
    update site_members set role = 'admin' where id = v_member_a_row;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 1
      then E'\n  PASS administrator can appoint another administrator'
      else E'\n  FAIL appointment changed no row' end;
  exception when others then
    v_log := v_log || E'\n  FAIL appointment refused (' || sqlstate || '): ' || sqlerrm;
  end;

  begin
    update site_members set role = 'member' where id = v_admin_a_row;
    select role into v_role from site_members where id = v_admin_a_row;
    v_log := v_log || case when v_role = 'member'
      then E'\n  PASS administrator can step down once another exists'
      else E'\n  FAIL step-down left role as ' || coalesce(v_role, 'null') end;
  exception when others then
    v_log := v_log || E'\n  FAIL step-down refused (' || sqlstate || '): ' || sqlerrm;
  end;

  -- Put club A back under an administrator for the checks below.
  reset role;
  perform set_config('request.jwt.claims', '', true);
  update site_members set role = 'admin' where id = v_admin_a_row;
  update site_members set role = 'member' where id = v_member_a_row;
  update site_members set status = 'pending', approved_by = null, approved_at = null
  where id = v_applicant_row;

  -- =========================================================================
  -- As an ordinary member of club A
  -- =========================================================================
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_member_a, 'role', 'authenticated',
                      'email', 'member.a@example.test')::text, true);

  -- 6. A member is not an administrator, whatever the console shows them.
  begin
    update site_members set status = 'active' where id = v_applicant_row;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS ordinary member cannot approve anyone'
      else E'\n  FAIL ordinary member approved ' || v_n || ' applicants' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS ordinary member cannot approve anyone';
  end;

  -- 7. And cannot see a pending applicant at all. The directory policy is
  --    restricted to active members, so somebody waiting on a decision is not
  --    visible to the membership while they wait.
  begin
    select count(*) into v_n from site_members
    where site_id = v_site_a and status = 'pending';
    v_log := v_log || case when v_n = 0
      then E'\n  PASS ordinary member cannot see pending applicants'
      else E'\n  FAIL ordinary member saw ' || v_n || ' pending applicants' end;
  end;

  -- 8. A member cannot promote themselves, which is 0013's guard doing its job
  --    against the exact request this console makes legitimately.
  begin
    update site_members set role = 'admin' where id = v_member_a_row;
    v_log := v_log || E'\n  FAIL ordinary member made themselves an administrator';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS ordinary member cannot promote themselves';
  end;

  -- =========================================================================
  -- As club B's administrator. The multi-tenant boundary.
  -- =========================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin_b, 'role', 'authenticated',
                      'email', 'admin.b@example.test')::text, true);

  -- 9. Club B's administrator must not see club A's queue.
  begin
    select count(*) into v_n from site_members where site_id = v_site_a;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS another club''s administrator sees nothing here'
      else E'\n  FAIL another club''s administrator saw ' || v_n || ' of our members' end;
  end;

  -- 10. And must not be able to approve into it by passing an id. This is the
  --     attack the console's tenant scoping is a second line of defense
  --     against; the policy is the first.
  begin
    update site_members set status = 'active' where id = v_applicant_row;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS another club''s administrator cannot approve into this one'
      else E'\n  FAIL another club''s administrator approved ' || v_n || ' of our applicants' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS another club''s administrator cannot approve into this one';
  end;

  -- 11. Nor move one of our members into their own club.
  begin
    update site_members set site_id = v_site_b where id = v_member_a_row;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS another club''s administrator cannot take our members'
      else E'\n  FAIL another club''s administrator moved ' || v_n || ' of our members' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS another club''s administrator cannot take our members';
  end;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  raise exception E'ADMIN QUEUE TEST RESULTS:%', v_log;
end $$;
