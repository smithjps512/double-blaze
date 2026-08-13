-- The identity helpers recursed, and it took the join form to notice.
--
-- Three functions from 0001 read the `users` table to answer "who is asking":
-- is_staff, current_org_id, and current_app_user_id. All three are used inside
-- row level security policies, and none of them ran with definer rights. So a
-- policy that called is_staff() ran a select against `users` as the caller,
-- `users` has a policy of its own that calls is_staff(), and that select ran a
-- select, and so on until Postgres gave up with "stack depth limit exceeded",
-- SQLSTATE 54001.
--
-- Why this survived three sessions unnoticed:
--
--   * Every write so far ran as the service role, which bypasses row level
--     security entirely, so no policy was ever evaluated.
--   * Reads that did run under a member session were saved by luck. Permissive
--     policies are OR'd together, and site_members_self_read is cheap and true
--     for the reader's own row, so Postgres short-circuited before it ever
--     reached the staff policy. Nothing guarantees that evaluation order. It
--     was a bug waiting for a query the planner happened to arrange
--     differently.
--
-- The join questionnaire is the first thing a real member does as the
-- `authenticated` role, and it failed immediately: an insert has no self-read
-- policy to short-circuit on, so is_staff() was reached every time.
--
-- The fix is the pattern 0013 already uses for the membership helpers, and for
-- the reason stated there: a policy must be able to ask a question about the
-- caller without the caller needing read access to the table holding the
-- answer, because that is circular. The lookup runs as the function owner,
-- whose access does not depend on the policy being evaluated.
--
-- ---------------------------------------------------------------------------
-- Why a definer function in `app` with an invoker wrapper in `public`
-- ---------------------------------------------------------------------------
--
-- The obvious fix, adding SECURITY DEFINER to the three public functions, works
-- and is wrong. PostgREST exposes the `public` schema as REST, so each one
-- becomes an RPC endpoint running with the owner's rights, and the Supabase
-- security advisor flags all three for anon and authenticated. That is the
-- warning 0013 avoided by putting the membership helpers in `app`, which is not
-- an exposed schema.
--
-- Moving these three would mean dropping and rebuilding every policy in 0001
-- that names them, since a policy holds a function by identity rather than by
-- name. That is a large change to make while fixing a recursion.
--
-- So the definer logic moves to `app` and the public functions stay exactly
-- where every existing policy expects them, as one-line invoker wrappers. The
-- recursion breaks at the `app` call, because the inner function does the
-- `users` lookup with the owner's rights and no policy is evaluated. The public
-- wrappers keep the privileges they have always had, so the advisor sees no
-- change in what is reachable over REST.
--
-- search_path is pinned on the definer functions, since a mutable search_path
-- is what turns a definer function into a privilege escalation. None of them
-- takes an argument, so there is no caller-supplied input: each reports a fact
-- about the caller's own JWT and nothing else.
--
-- current_clerk_id is deliberately left alone. It reads the JWT and touches no
-- table, so it never recursed and gains nothing from definer rights.

-- ---------------------------------------------------------------------------
-- 1. The lookups, with definer rights, out of the exposed schema
-- ---------------------------------------------------------------------------

create or replace function app.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from users where clerk_user_id = current_clerk_id()
$$;

create or replace function app.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select organization_id from users where clerk_user_id = current_clerk_id()
$$;

create or replace function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role in ('project_lead','admin') from users where clerk_user_id = current_clerk_id()),
    false
  )
$$;

-- Policies evaluate as the querying role, so both roles need EXECUTE. Granting
-- it here creates no REST endpoint, because `app` is not an exposed schema.
grant execute on function app.current_app_user_id() to authenticated, anon, service_role;
grant execute on function app.current_org_id() to authenticated, anon, service_role;
grant execute on function app.is_staff() to authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- 2. The public names every policy already holds, now delegating
-- ---------------------------------------------------------------------------
--
-- Invoker, as they have always been, so nothing new is reachable over REST.
-- Replacing the body rather than dropping and recreating is what lets the
-- existing policies keep working untouched.

create or replace function current_app_user_id()
returns uuid
language sql
stable
set search_path = public, pg_temp
as $$
  select app.current_app_user_id()
$$;

create or replace function current_org_id()
returns uuid
language sql
stable
set search_path = public, pg_temp
as $$
  select app.current_org_id()
$$;

create or replace function is_staff()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select app.is_staff()
$$;
