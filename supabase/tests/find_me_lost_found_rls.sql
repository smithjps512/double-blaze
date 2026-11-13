-- Behavioural test for Find Me lost and found (0056_find_me_lost_found.sql).
--
-- Paste into the Supabase SQL editor and run, after 0055 and 0056. It ends
-- in a deliberate `raise exception` carrying the results, which rolls
-- everything back. Expect every line to read PASS.
--
-- What it proves:
--   - the public sees a post but never its exact spot or secret detail
--   - a helper cannot read the secret detail; shelter staff can
--   - only the two people in a conversation can read it
--   - a helper cannot rewrite their answer after the fact, or impersonate
--     the poster
--   - messages cannot be sent into someone else's conversation
--   - closed posts disappear from the public

begin;

create temp table fm2_results (n serial, line text);
grant all on fm2_results to public;
grant usage, select on sequence fm2_results_n_seq to public;

do $$
declare
  owner uuid := gen_random_uuid();
  helper uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  staff uuid := gen_random_uuid();
  shelter uuid;
  report uuid;
begin
  insert into auth.users (id, email) values
    (owner, 'owner@example.org'), (helper, 'helper@example.org'),
    (outsider, 'outsider@example.org'), (staff, 'staff@example.org');
  insert into public.fm_shelters (slug, name, adoption_code) values ('lf-test', 'LF Test', 'LFTEST') returning id into shelter;
  insert into public.fm_staff (user_id, shelter_id) values (staff, shelter);
  perform set_config('fm2.owner', owner::text, true);
  perform set_config('fm2.helper', helper::text, true);
  perform set_config('fm2.outsider', outsider::text, true);
  perform set_config('fm2.staff', staff::text, true);
end $$;

create or replace function pg_temp.check(label text, ok boolean) returns void language sql as $$
  insert into fm2_results (line) values ((case when ok then 'PASS ' else 'FAIL ' end) || label);
$$;
create or replace function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
end $$;
create or replace function pg_temp.denied(sql text) returns boolean language plpgsql as $$
begin
  execute sql;
  return false;
exception when insufficient_privilege then
  return true;
end $$;

-- The owner posts a lost dog.
set local role authenticated;
select pg_temp.act_as(current_setting('fm2.owner'));
insert into public.fm_reports (kind, user_id, species, name, size, colors, seen_on, area_text, public_lat, public_lng)
  values ('lost', current_setting('fm2.owner')::uuid, 'dog', 'Biscuit', 'medium', 'tan', current_date, 'near the park', 37.23, -80.41);
select set_config('fm2.report', (select id::text from public.fm_reports limit 1), true);
insert into public.fm_report_private (report_id, exact_lat, exact_lng, secret_detail)
  values (current_setting('fm2.report')::uuid, 37.2296, -80.4139, 'notch in left ear');
select pg_temp.check('owner reads their own secret detail', exists (select 1 from public.fm_report_private));

-- The public.
set local role anon;
select pg_temp.act_as(null);
select pg_temp.check('public sees the post', exists (select 1 from public.fm_reports));
select pg_temp.check('public cannot read the private table',
  pg_temp.denied('select 1 from public.fm_report_private') or not exists (select 1 from public.fm_report_private));

-- A helper.
set local role authenticated;
select pg_temp.act_as(current_setting('fm2.helper'));
select pg_temp.check('helper cannot read the secret detail or exact spot', not exists (select 1 from public.fm_report_private));
select pg_temp.check('helper cannot start a conversation pretending to be someone else',
  pg_temp.denied(format(
    'insert into public.fm_conversations (report_id, poster_id, helper_id) values (%L, %L, %L)',
    current_setting('fm2.report'), current_setting('fm2.owner'), current_setting('fm2.outsider'))));
select pg_temp.check('helper cannot name a fake poster',
  pg_temp.denied(format(
    'insert into public.fm_conversations (report_id, poster_id, helper_id) values (%L, %L, %L)',
    current_setting('fm2.report'), current_setting('fm2.outsider'), current_setting('fm2.helper'))));
insert into public.fm_conversations (report_id, poster_id, helper_id, helper_detail)
  values (current_setting('fm2.report')::uuid, current_setting('fm2.owner')::uuid, current_setting('fm2.helper')::uuid, 'brown dog');
select set_config('fm2.conv', (select id::text from public.fm_conversations limit 1), true);
insert into public.fm_messages (conversation_id, sender_id, body) values (current_setting('fm2.conv')::uuid, current_setting('fm2.helper')::uuid, 'I think I saw him');
select pg_temp.check('helper cannot rewrite their ID answer later',
  pg_temp.denied(format('update public.fm_conversations set helper_detail = %L where id = %L', 'notch in left ear', current_setting('fm2.conv'))));
update public.fm_conversations set helper_read_at = now() where id = current_setting('fm2.conv')::uuid;
select pg_temp.check('helper can mark the conversation read', (select helper_read_at from public.fm_conversations) is not null);
select pg_temp.check('helper cannot send as the owner',
  pg_temp.denied(format('insert into public.fm_messages (conversation_id, sender_id, body) values (%L, %L, %L)',
    current_setting('fm2.conv'), current_setting('fm2.owner'), 'send money')));
update public.fm_reports set status = 'closed';  -- should match no rows for the helper

-- An outsider.
select pg_temp.act_as(current_setting('fm2.outsider'));
select pg_temp.check('outsider cannot read the conversation', not exists (select 1 from public.fm_conversations));
select pg_temp.check('outsider cannot read the messages', not exists (select 1 from public.fm_messages));
select pg_temp.check('outsider cannot post into the conversation',
  pg_temp.denied(format('insert into public.fm_messages (conversation_id, sender_id, body) values (%L, %L, %L)',
    current_setting('fm2.conv'), current_setting('fm2.outsider'), 'hello')));

-- The owner.
select pg_temp.act_as(current_setting('fm2.owner'));
select pg_temp.check('helper could not close the owner''s post', (select status from public.fm_reports) = 'open');
select pg_temp.check('owner reads the helper''s message', exists (select 1 from public.fm_messages));
select pg_temp.check('owner sees the helper''s ID answer next to their secret',
  (select helper_detail from public.fm_conversations) = 'brown dog');
select pg_temp.check('sending a message bumps the conversation',
  (select last_message_at from public.fm_conversations) is not null);

-- Shelter staff.
select pg_temp.act_as(current_setting('fm2.staff'));
select pg_temp.check('shelter staff read the exact spot and secret to help', exists (select 1 from public.fm_report_private));
select pg_temp.check('shelter staff cannot read private conversations', not exists (select 1 from public.fm_conversations));

-- The owner closes the post.
select pg_temp.act_as(current_setting('fm2.owner'));
update public.fm_reports set status = 'closed';
set local role anon;
select pg_temp.act_as(null);
select pg_temp.check('a closed post leaves the public list', not exists (select 1 from public.fm_reports));

reset role;
do $$
begin
  raise exception E'Find Me lost and found RLS results (rolled back):\n%',
    (select string_agg(line, E'\n' order by n) from fm2_results);
end $$;
