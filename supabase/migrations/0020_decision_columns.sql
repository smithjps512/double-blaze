-- What `approved_by` and `approved_at` actually record.
--
-- 0013 named them for the happy case, and session 3d writes them for both
-- outcomes: a decline is a decision too, and 0013's own reasoning applies to it
-- unchanged, that a decision is only reviewable with its inputs and its author.
-- A declined row that does not say who declined it is a row an administrator
-- cannot ask anybody about.
--
-- Renaming the columns was the alternative and was rejected. They are named in
-- the site_members_self_apply policy from 0017 and in the privilege guard from
-- 0013, so renaming means rewriting both to fix a word. Comments are visible in
-- the table editor, which is where anyone likely to be confused by the names is
-- actually looking.
--
-- Nothing wrote these columns before this session, so nothing needs correcting.

comment on column site_members.approved_by is
  'The administrator who decided, for approvals and declines alike. Read with status: approved_by plus status=declined is who turned them down.';

comment on column site_members.approved_at is
  'When the decision was taken, for approvals and declines alike.';
