-- Trailhead: status tracker and notification resilience.
--
-- Adds the columns the customer status page and the staff view need:
--   notification_failures: a durable, staff-visible log of best-effort emails
--     that failed, so a dropped notification is never invisible to us.
--   preview_sent_at: set when staff release the built preview to the customer.
--     Until then the build is "still finishing" from the customer's side, which
--     is the human review gate in brief section 4 step 5.
--   preview_accepted_at: set when the customer accepts their preview, the cue
--     for staff to publish.
--
-- No new tables, no enum changes: the existing preview_token doubles as the
-- single durable status token for the whole lifecycle.

alter table trailhead_sites
  add column if not exists notification_failures jsonb not null default '[]'::jsonb,
  add column if not exists preview_sent_at timestamptz,
  add column if not exists preview_accepted_at timestamptz;
