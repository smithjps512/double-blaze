-- Paint Your Spot is finished (BMS staff parking spot fundraiser). Remove its
-- tables and functions. The data was exported before this ran (18 interest
-- responses, 18 profiles, 8 settings) and handed to the project owner; it is
-- not kept in this public repository.
--
-- Its sign-ins in auth.users are left alone: auth is shared with other apps.

drop table if exists public.pys_interest_responses cascade;
drop table if exists public.pys_profiles cascade;
drop table if exists public.pys_settings cascade;

drop function if exists public.pys_interest_count();
drop function if exists public.pys_interest_counts();
drop function if exists public.pys_is_admin();
drop function if exists public.pys_is_boss();
drop function if exists public.pys_is_staff();
drop function if exists public.pys_responses_guard();
