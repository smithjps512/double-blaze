-- Find Me: tighten who can call the helper functions through the API.
--
-- Supabase's security advisor flags SECURITY DEFINER functions callable by
-- anon. None of these leak data (they answer yes/no about the caller), but
-- anything signed-out visitors do not need should not be callable by them.
--
-- Kept callable by anon on purpose:
--   fm_is_staff, fm_is_any_staff, fm_is_admin  used by the public read
--                                             policies on shelters, animals,
--                                             and lost and found posts
--   fm_reunion_count                          the public "back home" number
--
-- Trigger functions are never called directly; Postgres checks EXECUTE on a
-- trigger function only when the trigger is created, so revoking it from
-- every API role does not stop the triggers from firing.

revoke execute on function public.fm_claimable(uuid, uuid) from public, anon;
revoke execute on function public.fm_claimable_animals(text) from public, anon;
revoke execute on function public.fm_in_conversation(uuid) from public, anon;
revoke execute on function public.fm_owns_report(uuid) from public, anon;
grant execute on function public.fm_claimable(uuid, uuid) to authenticated, service_role;
grant execute on function public.fm_claimable_animals(text) to authenticated, service_role;
grant execute on function public.fm_in_conversation(uuid) to authenticated, service_role;
grant execute on function public.fm_owns_report(uuid) to authenticated, service_role;

revoke execute on function public.fm_on_adoption_confirmed() from public, anon, authenticated;
revoke execute on function public.fm_on_message() from public, anon, authenticated;
