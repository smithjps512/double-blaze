-- A club must not be able to lock itself out.
--
-- Session 3d exists so James can approve the club's real administrator and then
-- step back from the role. That sequence has an obvious wrong order: step back
-- first, and the site has no administrator, nobody can approve anyone, and
-- nobody can appoint a replacement. Every route out of that state runs through
-- Double Blaze staff and the service role, which is a support incident caused
-- by a button the console offered.
--
-- The guard in 0013 cannot cover this, because it exempts administrators by
-- design: an administrator changing a role is exactly what it exists to permit.
-- This is a different question. Not "may you do this" but "may the site end up
-- like that", and the answer depends on the other rows rather than on this one.
--
-- AFTER rather than BEFORE, because the count has to include the change being
-- made. A BEFORE trigger would still see the old row and would happily let the
-- last administrator go.
--
-- ---------------------------------------------------------------------------
-- What it does not block
-- ---------------------------------------------------------------------------
--
-- It fires only when the row being changed was itself the site's last active
-- administrator. A site that already has no administrator is left alone: that
-- is the state every new site is in before it is seeded, and raising there
-- would make bootstrapping a club impossible.
--
-- Double Blaze staff are exempt, so support can still take a club apart when
-- there is a reason to. So is anything that is not a PostgREST request from an
-- authenticated user, which means migrations and the service role, following
-- 0016. Note that this exemption is a choice rather than a fact: the service
-- role bypasses row level security, but nothing bypasses a trigger, which is
-- the lesson 0016 was written to record.

create or replace function app.guard_last_site_admin()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' or is_staff() then
    return null;
  end if;

  -- Only the departure of an active administrator can cause the problem.
  if not (old.role = 'admin'
          and old.status = 'active'
          and (old.access_expires_at is null or old.access_expires_at > now())) then
    return null;
  end if;

  -- Still an active administrator on this site? Then nothing was lost. This
  -- reads site_members with the owner's rights, so it sees the whole site
  -- rather than whatever the caller is allowed to see. A guard that could be
  -- satisfied by hiding rows from it would not be a guard.
  if exists (
    select 1 from site_members m
    where m.site_id = old.site_id
      and m.role = 'admin'
      and m.status = 'active'
      and (m.access_expires_at is null or m.access_expires_at > now())
  ) then
    return null;
  end if;

  raise exception 'This is the last administrator. Appoint another one before changing this.'
    using errcode = 'restrict_violation';
end;
$$;

drop trigger if exists guard_last_admin on site_members;
create trigger guard_last_admin after update or delete on site_members
  for each row execute function app.guard_last_site_admin();
