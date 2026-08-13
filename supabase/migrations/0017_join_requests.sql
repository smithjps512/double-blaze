-- Session 3c: an authenticated visitor applies for membership.
--
-- 0013 gave a member every state except the first one. There are policies for
-- reading your own row, editing your own row, reading the directory, and
-- administering a site, but nothing that lets a person who is not yet a member
-- create the row that makes them a pending applicant. Until now that gap did
-- not matter, because the only memberships in existence were seeded ones.
--
-- The alternative was a service-role insert from the join route, the way
-- claiming a seeded row works. That was rejected. Claiming is service-role
-- because the row is genuinely unreadable by the person claiming it, so no
-- policy could express the check. An application is the opposite: everything
-- that makes it legitimate is visible in the row itself and in the caller's
-- own JWT, so the database can state the rule and enforce it for every caller
-- rather than trusting one route to get it right.

-- ---------------------------------------------------------------------------
-- 1. Applying for membership
-- ---------------------------------------------------------------------------
--
-- The with-check clause is the whole security model of the join form. An
-- applicant chooses their answers and nothing else: they cannot arrive as an
-- admin, cannot arrive already active, cannot grant themselves a guest window,
-- and cannot apply under someone else's address.
--
-- email is compared against the JWT claim rather than trusted from the insert.
-- That matters more than it looks: site_members carries a unique index on
-- (site_id, lower(email)), so an insert under somebody else's address would
-- either impersonate a pending applicant or block a real person from ever
-- applying. If the claim is absent the comparison is null, the policy fails,
-- and the insert is refused, which is the right direction to fail in.
--
-- site_id is deliberately unconstrained. Any authenticated person may apply to
-- any club on the platform; that is what joining is. What they may not do is
-- arrive as anything other than a pending member.

drop policy if exists site_members_self_apply on site_members;
create policy site_members_self_apply on site_members
  for insert to authenticated
  with check (
    auth_user_id = auth.uid()
    and email = lower(auth.jwt() ->> 'email')
    and status = 'pending'
    and role = 'member'
    and access_expires_at is null
    and invited_by is null
    and approved_by is null
    and approved_at is null
  );

-- ---------------------------------------------------------------------------
-- 2. The answers stay the answers
-- ---------------------------------------------------------------------------
--
-- 0013 kept join_answers after approval on the grounds that a decision is only
-- reviewable with its inputs. site_members_self_update makes that a promise the
-- database was not keeping: a member may write their own row, so an approved
-- member could rewrite what they had told an administrator, and the record of
-- why they were admitted would quietly become whatever they last typed.
--
-- While the row is pending an applicant may still correct what they wrote,
-- because nobody has decided anything yet. Once it is not, the answers are
-- history. Administrators and staff are exempt, as they are from the rest of
-- this guard, since correcting a record is part of administering one.

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

  if old.status <> 'pending'
     and new.join_answers is distinct from old.join_answers then
    raise exception 'Join answers cannot be changed once a decision has been taken.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. What may be stored in join_answers
-- ---------------------------------------------------------------------------
--
-- The questionnaire caps every field, but the cap lives in application code and
-- the table is reachable over PostgREST by any authenticated caller. Without a
-- constraint here, "insert a pending row for yourself" is also "store a
-- megabyte of whatever you like in our database, once per club".
--
-- A table constraint rather than a clause on the policy, so it holds for
-- administrators and invitations too. The limit is generous next to the roughly
-- 900 characters the five questions can produce, because it exists to bound the
-- damage rather than to duplicate the validation.
--
-- length(join_answers::text) rather than pg_column_size, because the jsonb cast
-- is immutable and a check constraint has no business calling anything that is
-- not.

alter table site_members drop constraint if exists site_members_join_answers_bounded;
alter table site_members add constraint site_members_join_answers_bounded
  check (
    jsonb_typeof(join_answers) = 'object'
    and length(join_answers::text) <= 8192
  );
