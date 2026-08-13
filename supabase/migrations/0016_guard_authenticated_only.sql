-- The privilege guard was blocking the legitimate claim it was never meant to
-- see.
--
-- It exists to constrain site_members_self_update, the policy that lets a
-- member write their own row for profile editing and would otherwise let a
-- pending applicant set their own role to admin. Only the `authenticated` role
-- can use that policy.
--
-- Anything else reaching this table is trusted server code: the service role,
-- which already bypasses RLS entirely, or a migration. Linking a seeded or
-- invited row to the identity that just proved its email runs as the service
-- role, and the guard rejected it because filling in auth_user_id is exactly
-- the column change it watches for. Service role bypasses row level security,
-- but nothing bypasses a trigger.
--
-- auth.role() rather than current_user: inside a SECURITY DEFINER function
-- current_user is the function owner rather than the caller, so it would be
-- useless here. auth.role() reads the JWT claim and reports who is actually
-- asking. A null role means there is no PostgREST request at all, which is a
-- migration.

create or replace function app.guard_site_member_self_update()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  if is_staff() or app.is_site_admin(old.site_id) then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.site_id is distinct from old.site_id
     or new.auth_user_id is distinct from old.auth_user_id
     or new.email is distinct from old.email
     or new.access_expires_at is distinct from old.access_expires_at
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or new.invited_by is distinct from old.invited_by then
    raise exception 'A member may not change their own role, status, identity, or approval.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;
