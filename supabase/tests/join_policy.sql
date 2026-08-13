-- Behavioural test for the join questionnaire's database rules.
--
-- The unit tests in apps/members cover what the questionnaire accepts. They
-- cannot cover the part that actually matters for security, which is what the
-- database allows when a request arrives without going through the form at all.
-- Every rule below is reachable by anyone with a valid session and a REST
-- client, so it is worth proving rather than assuming.
--
-- ---------------------------------------------------------------------------
-- How to run it
-- ---------------------------------------------------------------------------
--
-- Paste the whole file into the Supabase SQL editor and run it. It ends in a
-- deliberate `raise exception` carrying the results, which rolls the entire
-- transaction back. That is the point: it creates auth identities and a
-- membership row, exercises them, and leaves nothing behind. A run that reports
-- results is a run that cleaned up after itself.
--
-- Expect every line to read PASS. Anything else is a real finding.
--
-- It cannot go through the MCP tools' execute_sql, which is read-only, so it is
-- run by hand or through apply_migration, where the closing exception means the
-- migration is never recorded.
--
-- ---------------------------------------------------------------------------
-- What it is testing, and why each one is here
-- ---------------------------------------------------------------------------
--
-- The privilege checks (admin, active, foreign address, foreign identity, self
-- approval) are the ones that would matter most if they broke, because each is
-- a way for an applicant to admit themselves to a vetted club.
--
-- The two "may" checks are here because a guard that blocks the wrong thing is
-- as broken as one that permits the wrong thing, and that is not hypothetical:
-- migration 0016 exists because this guard blocked a legitimate claim.
--
-- The directory check is tenant isolation. A pending applicant must not be able
-- to read the membership before a human has admitted them.

do $$
declare
  v_site uuid;
  v_uid uuid := '00000000-0000-4000-8000-00000000c3c3';
  v_other uuid := '00000000-0000-4000-8000-00000000c3c4';
  v_claims text;
  v_log text := '';
  v_id uuid;
  v_n int;
begin
  select id into v_site from sites order by created_at limit 1;
  if v_site is null then
    raise exception 'No site to test against.';
  end if;

  insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at)
  values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'applicant.test@example.com', now(), now()),
         (v_other, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'victim.test@example.com', now(), now());

  -- Become the applicant. Both halves are needed: the database role decides
  -- whether row level security applies at all, and the JWT claims are what
  -- auth.uid(), auth.jwt() and auth.role() read.
  v_claims := json_build_object('sub', v_uid, 'role', 'authenticated',
                                'email', 'applicant.test@example.com')::text;
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);

  -- 1. The application the form sends must be accepted.
  begin
    insert into site_members (site_id, auth_user_id, email, display_name, role, status, join_answers)
    values (v_site, v_uid, 'applicant.test@example.com', 'Test Applicant', 'member', 'pending',
            '{"employer":"Cascade Power Authority","industry":"grid"}'::jsonb)
    returning id into v_id;
    v_log := v_log || E'\n  PASS legitimate application accepted';
  exception when others then
    v_log := v_log || E'\n  FAIL legitimate application refused (' || sqlstate || '): ' || sqlerrm;
  end;

  if v_id is null then
    reset role;
    raise exception E'JOIN POLICY TEST RESULTS:%\n  (aborted, the rest needs the row)', v_log;
  end if;

  -- 2. They can read their own row back, which is what the front door does on
  --    every request to decide what to show them.
  begin
    select count(*) into v_n from site_members where id = v_id;
    v_log := v_log || case when v_n = 1
      then E'\n  PASS applicant can read their own row'
      else E'\n  FAIL applicant cannot read their own row' end;
  exception when others then
    v_log := v_log || E'\n  FAIL self read failed (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 3. Pending is not membership. The roster stays closed until a human opens
  --    it.
  begin
    select count(*) into v_n from site_members where site_id = v_site and id <> v_id;
    v_log := v_log || case when v_n = 0
      then E'\n  PASS pending applicant sees no other members'
      else E'\n  FAIL pending applicant saw ' || v_n || ' other members' end;
  exception when others then
    v_log := v_log || E'\n  FAIL directory read errored (' || sqlstate || '): ' || sqlerrm;
  end;

  -- 4. Applying as an administrator.
  begin
    insert into site_members (site_id, auth_user_id, email, role, status)
    values (v_site, v_uid, 'admin.test@example.com', 'admin', 'pending');
    v_log := v_log || E'\n  FAIL applied as admin and was accepted';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS admin application refused';
  when others then
    v_log := v_log || E'\n  ???? admin application refused with ' || sqlstate;
  end;

  -- 5. Applying already approved.
  begin
    insert into site_members (site_id, auth_user_id, email, role, status)
    values (v_site, v_uid, 'active.test@example.com', 'member', 'active');
    v_log := v_log || E'\n  FAIL applied as active and was accepted';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS active application refused';
  when others then
    v_log := v_log || E'\n  ???? active application refused with ' || sqlstate;
  end;

  -- 6. Applying under an address they have not proved. This one also protects
  --    a real person: the unique index on (site_id, lower(email)) means a
  --    squatted address could block them from ever applying.
  begin
    insert into site_members (site_id, auth_user_id, email, role, status)
    values (v_site, v_uid, 'victim.test@example.com', 'member', 'pending');
    v_log := v_log || E'\n  FAIL applied under another address and was accepted';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS foreign-address application refused';
  when others then
    v_log := v_log || E'\n  ???? foreign-address refused with ' || sqlstate;
  end;

  -- 7. Applying on behalf of another identity.
  begin
    insert into site_members (site_id, auth_user_id, email, role, status)
    values (v_site, v_other, 'other.test@example.com', 'member', 'pending');
    v_log := v_log || E'\n  FAIL applied for another identity and was accepted';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS foreign-identity application refused';
  when others then
    v_log := v_log || E'\n  ???? foreign-identity refused with ' || sqlstate;
  end;

  -- 8. Nobody has decided anything yet, so corrections are allowed.
  begin
    update site_members set join_answers = join_answers || '{"role_title":"Planner"}'::jsonb
    where id = v_id;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 1
      then E'\n  PASS pending applicant may correct answers'
      else E'\n  FAIL pending correction changed no row' end;
  exception when others then
    v_log := v_log || E'\n  FAIL pending correction refused: ' || sqlerrm;
  end;

  -- 9. The whole reason the guard in 0013 exists.
  begin
    update site_members set status = 'active' where id = v_id;
    v_log := v_log || E'\n  FAIL applicant approved themselves';
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS applicant cannot approve themselves';
  end;

  -- An administrator approves them. The JWT claim has to be cleared as well as
  -- the database role, because the guard keys on auth.role(), which reads the
  -- claim rather than the session's actual role.
  reset role;
  perform set_config('request.jwt.claims', '', true);
  update site_members set status = 'active' where id = v_id;
  set local role authenticated;
  perform set_config('request.jwt.claims', v_claims, true);

  -- 10. A decision is only reviewable with its inputs, so the answers are now
  --     history.
  begin
    update site_members set join_answers = '{"employer":"Somewhere Better"}'::jsonb
    where id = v_id;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 0
      then E'\n  FAIL freeze check changed no row, so it proved nothing'
      else E'\n  FAIL approved member rewrote their own answers' end;
  exception when insufficient_privilege then
    v_log := v_log || E'\n  PASS approved member cannot rewrite answers';
  end;

  -- 11. And the freeze must not have taken profile editing with it, which is
  --     the whole point of site_members_self_update and all of session 4.
  begin
    update site_members set profile = '{"headline":"Grid planner"}'::jsonb where id = v_id;
    get diagnostics v_n = row_count;
    v_log := v_log || case when v_n = 1
      then E'\n  PASS approved member may still edit their profile'
      else E'\n  FAIL profile edit changed no row' end;
  exception when others then
    v_log := v_log || E'\n  FAIL profile edit refused: ' || sqlerrm;
  end;

  -- 12. The size bound, checked as an administrator so the freeze guard is out
  --     of the way and the constraint is what answers.
  reset role;
  perform set_config('request.jwt.claims', '', true);
  begin
    update site_members set join_answers = json_build_object('x', repeat('y', 9000))::jsonb
    where id = v_id;
    v_log := v_log || E'\n  FAIL oversized join_answers accepted';
  exception when check_violation then
    v_log := v_log || E'\n  PASS oversized join_answers refused by the constraint';
  end;

  raise exception E'JOIN POLICY TEST RESULTS:%', v_log;
end $$;
