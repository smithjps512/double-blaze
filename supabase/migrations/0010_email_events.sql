-- Email delivery events from the Resend webhook.
--
-- Why this exists: sending an email and delivering one are different events.
-- The app only ever saw the first. Resend accepts a message and returns
-- success, then the delivery fails afterward, so a hard bounce never reached
-- recordNotificationFailure and every bounced send was recorded as a success.
-- That is how yourteam+intake@doubleblaze.solutions bounced for weeks with the
-- platform reporting no failures at all.
--
-- Every event Resend sends is stored here, whatever its type, so subscribing to
-- more event types in the Resend dashboard needs no migration. The route
-- decides which types count as failures.

create extension if not exists "pgcrypto";

create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),

  -- Resend's id for the message. Not unique: one message legitimately produces
  -- several events (sent, then delivered, or sent, then bounced).
  resend_email_id text,

  -- Svix message id, unique per delivery attempt. This is the idempotency key:
  -- webhooks are at-least-once, and a retry must not double-record a bounce.
  svix_id text,

  event_type text not null,          -- email.bounced, email.complained, ...
  recipient text,
  subject text,

  -- True for the types that mean a human did not get the message. Set by the
  -- route so the failure list is a column read rather than a string match.
  is_failure boolean not null default false,

  -- Short human-readable cause, pulled from the bounce/failure detail.
  reason text,

  -- The whole event, so nothing is lost to a parser that did not anticipate a
  -- field. Resend's payload shape varies by event type.
  payload jsonb not null default '{}'::jsonb,

  -- Set when the recipient matched a Trailhead customer, so staff can see the
  -- failure against the site rather than only in a global list.
  trailhead_site_id uuid references trailhead_sites(id) on delete set null,

  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

-- Idempotency: a Svix retry carries the same svix-id, so a unique index makes
-- the insert a no-op on replay. Partial, because svix_id is null only if a
-- malformed event somehow gets stored, and nulls should not collide.
create unique index if not exists email_events_svix_id_uidx
  on email_events(svix_id) where svix_id is not null;

-- "What is broken right now" is the query this table exists to answer.
create index if not exists email_events_failure_idx
  on email_events(created_at desc) where is_failure;

create index if not exists email_events_recipient_idx
  on email_events(recipient);

create index if not exists email_events_site_idx
  on email_events(trailhead_site_id) where trailhead_site_id is not null;

alter table email_events enable row level security;

-- Staff-only. Writes come from the webhook route via the service role, which
-- bypasses RLS, so no insert policy is needed for the public path.
drop policy if exists email_events_staff_all on email_events;
create policy email_events_staff_all on email_events
  for all using (is_staff()) with check (is_staff());
