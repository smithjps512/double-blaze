-- Behavioural test for Find Me's row-level security (0055_find_me.sql).
--
-- Paste into the Supabase SQL editor and run. It ends in a deliberate
-- `raise exception` carrying the results, which rolls everything back, so it
-- leaves nothing behind. Expect every line to read PASS.
--
-- What it proves, because each is reachable by anyone with a session and a
-- REST client:
--   - the public sees available animals and not adopted ones
--   - shelter staff cannot edit another shelter's animals
--   - an adopter cannot read another adopter's answers or inquiries
--   - an adopter cannot send an inquiry as someone else
--   - an adopter cannot claim an adoption as already confirmed
--   - a shelter cannot see another shelter's inquiries
--   - confirming an adoption takes the animal off the public listing

begin;

create temp table fm_results (n serial, line text);
grant all on fm_results to public;
grant usage, select on sequence fm_results_n_seq to public;

do $$
declare
  staff_a uuid := gen_random_uuid();
  staff_b uuid := gen_random_uuid();
  adopter1 uuid := gen_random_uuid();
  adopter2 uuid := gen_random_uuid();
  shelter_a uuid;
  shelter_b uuid;
  dog_a uuid;
  dog_b uuid;
  gone uuid;
begin
  insert into auth.users (id, email) values
    (staff_a, 'staff-a@example.org'), (staff_b, 'staff-b@example.org'),
    (adopter1, 'one@example.org'), (adopter2, 'two@example.org');
  insert into public.fm_shelters (slug, name, adoption_code) values ('test-a', 'Test A', 'TESTA') returning id into shelter_a;
  insert into public.fm_shelters (slug, name, adoption_code) values ('test-b', 'Test B', 'TESTB') returning id into shelter_b;
  insert into public.fm_staff (user_id, shelter_id) values (staff_a, shelter_a), (staff_b, shelter_b);
  insert into public.fm_animals (shelter_id, species, name, sex, age_group, size)
    values (shelter_a, 'dog', 'Alpha', 'male', 'adult', 'medium') returning id into dog_a;
  insert into public.fm_animals (shelter_id, species, name, sex, age_group, size)
    values (shelter_b, 'dog', 'Bravo', 'female', 'adult', 'small') returning id into dog_b;
  insert into public.fm_animals (shelter_id, species, name, sex, age_group, size, status)
    values (shelter_a, 'cat', 'Gone', 'female', 'adult', 'small', 'adopted') returning id into gone;
  perform set_config('fm.dog_a', dog_a::text, true);
  perform set_config('fm.dog_b', dog_b::text, true);
  perform set_config('fm.gone', gone::text, true);
  perform set_config('fm.shelter_a', shelter_a::text, true);
  perform set_config('fm.shelter_b', shelter_b::text, true);
  perform set_config('fm.staff_a', staff_a::text, true);
  perform set_config('fm.adopter1', adopter1::text, true);
  perform set_config('fm.adopter2', adopter2::text, true);
end $$;

create or replace function pg_temp.check(label text, ok boolean) returns void language sql as $$
  insert into fm_results (line) values ((case when ok then 'PASS ' else 'FAIL ' end) || label);
$$;

create or replace function pg_temp.act_as(uid text, email text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid, ''), true);
  perform set_config('request.jwt.claim.email', coalesce(email, ''), true);
end $$;

-- The public.
set local role anon;
select pg_temp.act_as(null, null);
select pg_temp.check('public sees available animals',
  (select count(*) from public.fm_animals where id in (current_setting('fm.dog_a')::uuid, current_setting('fm.dog_b')::uuid)) = 2);
select pg_temp.check('public does not see adopted animals',
  not exists (select 1 from public.fm_animals where id = current_setting('fm.gone')::uuid));

-- Staff at shelter A.
set local role authenticated;
select pg_temp.act_as(current_setting('fm.staff_a'), 'staff-a@example.org');
update public.fm_animals set name = 'Hacked' where id = current_setting('fm.dog_b')::uuid;
update public.fm_animals set bio = 'Updated' where id = current_setting('fm.dog_a')::uuid;
select pg_temp.check('staff sees their own adopted animals',
  exists (select 1 from public.fm_animals where id = current_setting('fm.gone')::uuid));

do $$
begin
  insert into public.fm_animals (shelter_id, species, name, sex, age_group, size)
    values (current_setting('fm.shelter_b')::uuid, 'dog', 'Sneaky', 'male', 'adult', 'small');
  perform pg_temp.check('staff cannot add animals to another shelter', false);
exception when insufficient_privilege then
  perform pg_temp.check('staff cannot add animals to another shelter', true);
end $$;

-- Adopter 1.
select pg_temp.act_as(current_setting('fm.adopter1'), 'one@example.org');
insert into public.fm_adopter_answers (user_id, answers) values (current_setting('fm.adopter1')::uuid, '{"species":"dog"}');
insert into public.fm_inquiries (user_id, animal_id, shelter_id, adopter_name, adopter_email, message)
  values (current_setting('fm.adopter1')::uuid, current_setting('fm.dog_a')::uuid, current_setting('fm.shelter_a')::uuid, 'One', 'one@example.org', 'Hi');

do $$
begin
  insert into public.fm_inquiries (user_id, animal_id, shelter_id, adopter_name, adopter_email)
    values (current_setting('fm.adopter1')::uuid, current_setting('fm.dog_b')::uuid, current_setting('fm.shelter_b')::uuid, 'One', 'someone-else@example.org');
  perform pg_temp.check('adopter cannot send an inquiry under another email', false);
exception when insufficient_privilege then
  perform pg_temp.check('adopter cannot send an inquiry under another email', true);
end $$;

do $$
begin
  insert into public.fm_adoptions (user_id, animal_id, shelter_id, pet_name, status)
    values (current_setting('fm.adopter1')::uuid, current_setting('fm.dog_a')::uuid, current_setting('fm.shelter_a')::uuid, 'Alpha', 'confirmed');
  perform pg_temp.check('adopter cannot self-confirm an adoption', false);
exception when insufficient_privilege then
  perform pg_temp.check('adopter cannot self-confirm an adoption', true);
end $$;

insert into public.fm_adoptions (user_id, animal_id, shelter_id, pet_name)
  values (current_setting('fm.adopter1')::uuid, current_setting('fm.gone')::uuid, current_setting('fm.shelter_a')::uuid, 'Gone');
select pg_temp.check('adopter can claim a recently adopted animal from the QR code',
  exists (select 1 from public.fm_adoptions where animal_id = current_setting('fm.gone')::uuid));
select pg_temp.check('adopter sees the animal they claimed',
  exists (select 1 from public.fm_animals where id = current_setting('fm.gone')::uuid));
insert into public.fm_adoptions (user_id, animal_id, shelter_id, pet_name)
  values (current_setting('fm.adopter1')::uuid, current_setting('fm.dog_a')::uuid, current_setting('fm.shelter_a')::uuid, 'Alpha');

-- Adopter 2.
select pg_temp.act_as(current_setting('fm.adopter2'), 'two@example.org');
select pg_temp.check('adopter cannot read another adopter''s answers', not exists (select 1 from public.fm_adopter_answers));
select pg_temp.check('adopter cannot read another adopter''s inquiries', not exists (select 1 from public.fm_inquiries));
select pg_temp.check('adopter cannot read another adopter''s adoptions', not exists (select 1 from public.fm_adoptions));

-- Staff at shelter B cannot see shelter A's inquiries.
select pg_temp.act_as(null, null);
reset role;
select pg_temp.check('the other shelter''s animal was not changed',
  (select name from public.fm_animals where id = current_setting('fm.dog_b')::uuid) = 'Bravo');
select pg_temp.check('staff can edit their own animal',
  (select bio from public.fm_animals where id = current_setting('fm.dog_a')::uuid) = 'Updated');

set local role authenticated;
select pg_temp.act_as((select user_id::text from public.fm_staff where shelter_id = current_setting('fm.shelter_b')::uuid limit 1), 'staff-b@example.org');
select pg_temp.check('a shelter cannot see another shelter''s inquiries', not exists (select 1 from public.fm_inquiries));

-- Staff at shelter A confirms the claim on Alpha.
select pg_temp.act_as(current_setting('fm.staff_a'), 'staff-a@example.org');
select pg_temp.check('staff see inquiries for their shelter', exists (select 1 from public.fm_inquiries));
update public.fm_adoptions set status = 'confirmed' where animal_id = current_setting('fm.dog_a')::uuid;
select pg_temp.act_as(null, null);
set local role anon;
select pg_temp.check('a confirmed adoption leaves the public listing',
  not exists (select 1 from public.fm_animals where id = current_setting('fm.dog_a')::uuid));

reset role;
do $$
begin
  raise exception E'Find Me RLS results (rolled back):\n%',
    (select string_agg(line, E'\n' order by n) from fm_results);
end $$;
