-- One open invitation per address per club.
--
-- 0013 built `site_invitations` and nothing wrote to it until session 3e, so
-- this is the first migration with a real workload in view.
--
-- Without it, "invite Dana" clicked twice produces two live tokens for the same
-- address. Both work, both create the same membership by way of the same email,
-- and revoking the one an administrator can see leaves the other one live.
-- An administrator who revokes an invitation has every reason to believe the
-- invitation is revoked, and this is what makes that true.
--
-- The index is partial rather than a plain unique constraint, because the
-- history matters. A club that invites somebody, has them leave, and invites
-- them again a year later should end up with two rows, and only one of them
-- open. Accepted and revoked rows fall out of the index entirely.
--
-- lower(email) to match `site_members_site_email_uidx` from 0013. An address
-- that is a duplicate in one table and distinct in the other would be a bug
-- waiting for somebody to type a capital letter.
--
-- The consequence for the application: re-inviting somebody is revoke then
-- issue, not issue again. That is the correct sequence anyway, since it leaves
-- exactly one working link, and the route does it in that order.

create unique index if not exists site_invitations_one_open_uidx
  on site_invitations(site_id, lower(email))
  where accepted_at is null and revoked_at is null;
