-- Paint Your Spot: an interest deadline, a goal of 25, and a split count.
--
-- Phase 1 is a go or no-go check. The committee wants to see I'm in and
-- Probably separately, then make a judgement call after the deadline. The
-- site never decides on its own.

-- Allow the new deadline setting (a date, YYYY-MM-DD, Eastern time).
alter table public.pys_settings drop constraint if exists pys_settings_key_check;
alter table public.pys_settings add constraint pys_settings_key_check check (key in (
  'standard_fee',
  'prime_fee',
  'boss_pot_goal',
  'interest_goal',
  'interest_deadline',
  'payment_link',
  'money_destination',
  'term_text'
));

insert into public.pys_settings (key, value) values ('interest_deadline', '2026-10-16')
on conflict (key) do nothing;

-- Goal moves from 20 to 25, unless someone already changed it from the seed.
update public.pys_settings set value = '25', updated_at = now()
where key = 'interest_goal' and value = '20';

-- Public counts for the meter: numbers only, never names.
create or replace function public.pys_interest_counts()
returns table (in_count integer, probably_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where interest_level = 'in')::integer,
    count(*) filter (where interest_level = 'probably')::integer
  from public.pys_interest_responses;
$$;

revoke all on function public.pys_interest_counts() from public;
grant execute on function public.pys_interest_counts() to anon, authenticated;
