-- Pin the search path on the jd_events append-only guard (Supabase advisor 0011).
alter function public.jd_events_append_only() set search_path = public;
