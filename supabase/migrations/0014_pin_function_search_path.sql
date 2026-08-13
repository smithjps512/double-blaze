-- Pin search_path on the helper functions from 0001.
--
-- A mutable search_path on a SECURITY DEFINER function is how one becomes a
-- privilege escalation: the caller controls which schema a bare table name
-- resolves to. These five predate the membership work and were flagged by the
-- Supabase security advisor; hardening that class of function while adding
-- security-sensitive functions beside them, and leaving the neighbours
-- unpinned, would be odd.
--
-- After this, the advisor reports no security findings.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.current_clerk_id() set search_path = public, pg_temp;
alter function public.current_app_user_id() set search_path = public, pg_temp;
alter function public.current_org_id() set search_path = public, pg_temp;
alter function public.is_staff() set search_path = public, pg_temp;
