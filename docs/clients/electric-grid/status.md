# Electric Grid: build status and session handoff

Where the build is, what is verified rather than merely written, and what a
fresh session needs to know before touching anything.

**Coming to this cold? Read [`HANDOFF.md`](./HANDOFF.md) first.** It is shorter
and says what matters before any of the detail here does.

Then this document, then [`build-plan.md`](./build-plan.md) for the plan and
[`brief.md`](./brief.md) for the client's own words.

No em dashes anywhere in this document.

---

## 0. The near-term goal, which shapes everything below

**James is running a user test with real testers once session 7 is done.** That
is the target the next four sessions are working toward, and it changes what
"done" means in a way worth stating before anything else.

A tester needs to be able to arrive, look around, and do something. So:

- **Getting in has to be frictionless.** Invitations (3e) are the path testers
  will use. James invites them directly, no questionnaire, no approval queue,
  one click.
- **The club cannot be empty.** This is the part that is easy to miss. A tester
  cannot test "access media", "react to a post", or "connect with members" if
  there is nothing to do it to. The demo seed stopped being housekeeping and
  became part of the deliverable, which is why it now sits between sessions 5
  and 6 rather than at the end.
- **Depth matters less than breadth.** Four features a tester can walk through
  beats two that are polished. Anything genuinely deferrable should be deferred
  and written down here, not built.

The agreed order is **5, then the seed, then 6, then 7.**

---

## 1. Session status

| # | Session | State |
|---|---|---|
| 1 | Platform spine | **Done, verified in production.** Two Vercel projects serving, both confirmed by curl. |
| 2 | Marketing landing page | **Built, at its gate.** Reviewed by James, hero rewritten twice. Not yet shown to the club. |
| 3 | Identity and join | **Built, awaiting its gate.** Schema, email sign-in, the join questionnaire, the approval queue, and invitations. Both join paths from the brief now exist. Sign-in is verified end to end with a real inbox; everything since is verified against the database but not yet by a human. |
| 4 | Profiles and directory | **Built, awaiting its gate.** Photo upload, the profile fields, the first-login prompt, and the directory. Storage policies verified; a real image upload through a browser is the gate. |
| 5 | Articles and media | Not started. **Next.** |
| - | Demo seed | Not started. Sits here, between 5 and 6. See section 0. |
| 6 | Events | Not started. |
| 7 | Engagement | Not started. Last one before James's user test. |
| 8-10 | Notifications, admin console, launch | Not started. After the user test. |

### What "verified" means here

Session 1 and session 3b were tested against the live deployment with a real
inbox, not just compiled. Three bugs have been found that way or by exercising
the database directly, and none was reachable by the unit tests. See section 5.

The database rules behind 3c and 3d are verified behaviourally rather than
structurally. Two suites run as actual `authenticated` sessions and prove what
is accepted and what is refused:

| Suite | Covers | Checks |
|---|---|---|
| [`supabase/tests/join_policy.sql`](../../../supabase/tests/join_policy.sql) | What an application may claim | 12, all passing |
| [`supabase/tests/admin_queue.sql`](../../../supabase/tests/admin_queue.sql) | Approval, the last-administrator guard, the multi-tenant boundary | 12, all passing |
| [`supabase/tests/invitations.sql`](../../../supabase/tests/invitations.sql) | Who can issue, read, and revoke a credential | 12, all passing |
| [`supabase/tests/member_media.sql`](../../../supabase/tests/member_media.sql) | Who can write, read, and delete an uploaded file | 8, all passing |

The last two build two clubs each and prove that one club's administrator can
neither see, approve into, take members from, nor read the invitations of the
other. That boundary is the entire commercial case for `apps/members` being
multi-tenant, and it is now tested rather than reasoned about.

What is **not** verified is a real person doing any of this in a browser, which
is what the session 3 and 4 gates are for.

### What exists in `apps/members` today

So a fresh session can see the shape without reading every file.

| Route | What it is |
|---|---|
| `/` | The front door. Routes by membership status, and sends a member with no profile to write one |
| `/sign-in` | Email address in, magic link out. Also where every invitation failure explains itself |
| `/join` | The questionnaire. Four questions plus a name |
| `/invite/[token]` | Accepting an invitation. One click to an active membership and a session |
| `/profile` | Editing your own, including the photo |
| `/directory` | Everyone who is active and not hidden |
| `/members/[id]` | One profile, as another member sees it |
| `/admin` | The approval queue, the member list with roles, and issuing invitations |
| `/api/media/[...path]` | Serves uploads from the private bucket under the reader's session |

Libraries: `tenant.ts` resolves the club by hostname, `auth.ts` holds the two
Supabase clients and `getSignedInMember`, `email.ts` sends as the club, and the
four pure modules named in section 6.

---

## 2. Live infrastructure

Three Vercel projects, all from this repository, distinguished by root
directory. See [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md) and
[`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md).

| Project | Root | Hostname |
|---|---|---|
| `double-blaze` | `apps/platform` | `doubleblaze.solutions`, `www` |
| `double-blaze-sites` | `apps/sites` | `*.doubleblaze.solutions` |
| `double-blaze-members` | `apps/members` | `electricgrid-members.doubleblaze.solutions` |

**Supabase Auth is configured**: email provider on, confirm email on, redirect
allow-list includes `https://*.doubleblaze.solutions/**` (the wildcard matters,
it is what makes the second club not require an auth settings change). SMTP is
deliberately unconfigured; sign-in links are generated by the admin API and
sent through Resend so they carry the verified domain and their failures reach
the bounce webhook.

**Supabase security advisor reports one finding**, `auth_leaked_password_protection`,
which is not applicable: there are no passwords on this project. Sign-in is a
magic link and nothing stores or checks a password. Zero findings otherwise,
and keeping it that way is why migration 0018 puts its definer functions in the
`app` schema rather than in `public`. See section 5.

### Database state

- `organizations`, `projects`, `sites` each have exactly one row: Electric
  Grid. These were the first rows ever written to those tables, and
  `sites.source_trailhead_site_id` carries the Trailhead conversion
  attribution.
- `sites.status` is `draft`. The member area works anyway; only the public page
  requires publication.
- One `site_members` row: James, admin, active, claimed.
- The Trailhead demo (`trailhead_sites.subdomain = 'electricgrid'`) is still at
  `preview` and should stay there. Its export bundle is the artifact that won
  the work.

**Migration history drift, harmless but worth knowing.** The remote records one
extra migration the repository does not have: a first attempt at 0018 that made
the identity helpers definer functions in `public`, superseded minutes later by
the `app`-schema version now in `supabase/migrations/0018`. The resulting schema
is identical either way, and applying the repository's migrations to a fresh
database produces the correct final state. Nothing needs undoing.

### How the two halves connect

The landing page's "Request to join" now points at
`https://electricgrid-members.doubleblaze.solutions/sign-in`, an absolute URL
rather than a page slug. It had been `href: "join"`, which resolved to a page on
the static site that does not exist, so the join flow was unreachable from the
marketing page. Session 10 puts both halves behind one hostname with path
routing, per section 1 of [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md), and
this goes back to a plain path then.

It points at sign-in rather than at the questionnaire because a visitor has to
prove an address first. One link serves everyone: a stranger lands on the
questions after signing in, an applicant lands on their pending notice, and a
member lands in the member area.

---

## 3. Decisions already made

Do not reopen these without a reason. Rationale is in the architecture doc and
the build plan.

- **Tenancy:** clients are rows, never branches or repositories.
  `apps/members` is multi-tenant from the first line.
- **Media:** video embedded from YouTube/Vimeo, audio and documents
  self-hosted. No managed video service yet.
- **Discussion:** reactions and comments only. No forums, no channels.
- **Profiles:** visible to approved members, nothing public. This supersedes
  the Trailhead intake, which said the roster was public.
- **Moderation:** publish immediately, admins can remove.
- **Payments:** none at launch. When they arrive, Stripe Connect, never the
  Double Blaze account.
- **Auth:** Supabase Auth for members, Clerk for Double Blaze staff and client
  account holders. The two planes meet nowhere.

### Open, and blocking at some point

- **Commercial terms.** One-time build plus recurring hosting and maintenance,
  still unpriced. This is the item standing between the brief and a proposal.
- **The club's domain.** Needed for session 10, and separately for a publishable
  Google OAuth consent screen. Google sign-in can be tested without one.
- **Antitrust and competition language.** Raised by James, recorded in the build
  plan section 3. Needs the club's counsel before launch.
- **GDPR.** International membership, so it applies. Build it in from session 4
  rather than retrofitting at session 9.
- **The club's name.** "AI Interest for Electric Grid" reads like a working
  title and appears in the header, every page title, and every email.

---

## 4. Next actions, in order

1. **Session 5: articles and media.** The core of the brief, and the biggest
   session left. Written, audio, and embedded video. Article series. The author
   is the profile, which session 4 just made real. Draft and publish. The gated
   library, and per-article read counts.

   Design notes so a fresh session does not re-derive them:

   - **Media split, already decided** (build plan section 2). Video is embedded
     from YouTube or Vimeo; audio and documents are self-hosted. The
     `member-media` bucket from 0022 already accepts audio and PDF at 50MB, and
     its path policies already work, so the storage half is done. Video view
     counts live off-site, so unique-reader analytics cover written and audio
     articles only.
   - **Moderation, already decided.** Publish immediately, administrators can
     remove, members can report. Members are vetted at the door; gating every
     post again taxes the activity the brief calls most critical.
   - **The content area still needs a name.** Flagged in the brief and in build
     plan section 3, item 6. Options get proposed at the session 5 gate. Until
     then, do not invent one and quietly ship it.
   - **Analytics are member-level reading data.** Total and unique reader counts
     per article, per the brief. Who can see them and how long they are kept is
     a policy question for session 9, but the retention decision should not be
     made accidentally by whatever the schema happens to do. Record what is
     stored and why.
   - **One question this session raises:** does a lapsed guest keep read access
     to the library? Today the answer is no, because `app.is_active_site_member`
     says so. That is the safe direction, and it is worth confirming rather than
     inheriting.

2. **The demo seed.** See section 0 for why it moved up. Flagged rows, a purge
   command, and a publish-time guard that refuses to go live while demo rows
   exist.

   The rules are firm: **fictional employers only, never a real utility**, and
   **no fabricated statistics in article bodies**. A seeded article that invents
   a load-growth number, attached to a real utility's name, is the kind of thing
   that outlives the demo and ends up quoted. Seeded members should be
   recognisably fictional to a reader in the industry.

   Enough of it to make a user test work: a handful of members with real-looking
   profiles, several articles across all three media kinds, and one article
   series. Events and reactions come once 6 and 7 exist, so expect to extend it.

3. **Session 6: events.** Any member schedules one. Topic, description, and date
   required; conferencing link and physical location optional. Invitations.
   No gate.

4. **Session 7: engagement.** Member-to-member connections, reactions and
   comments on articles and events. No gate, and the last thing before the user
   test.

5. **Then the user test**, and only after it, sessions 8 to 10.

### The gates that are owed

Sessions 3 and 4 are both built and both waiting on a human. Neither blocks
sessions 5 to 7 from being built, but both block the user test, because a tester
hitting a broken sign-in or a broken photo upload ends the test.

- **Session 3 gate.** Needs James, a real inbox, and a second human. Both join
  paths, the queue, the handover, guest expiry, and revocation. The script is
  section 5 of [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md).
- **Session 4 gate.** The first real image upload end to end, which is the one
  thing no test here can reach.

Worth running both in one sitting, since they share a setup.

### Settled in 3c: what the questionnaire asks

The open question was which fields, and it is now closed. Four questions plus a
name, checked against the brief, which asks only for "enough information to
make an approval decision (employer, affiliation to industry/AI)".

| Question | Stored as | Required |
|---|---|---|
| Your name | `display_name` column | Yes |
| Employer | `join_answers.employer` | Yes |
| Role or title | `join_answers.role_title` | Yes |
| Where does your work sit: grid / AI / neither | `join_answers.industry` | Yes |
| What are you hoping to get from the forum | `join_answers.interest` | Only if "neither" |

Two choices worth keeping if the set is revisited:

- **The name is a column, not an answer.** A magic link proves an address and
  says nothing else, and `display_name` is what the queue and later the whole
  directory read.
- **The free text turns required only for "neither".** That is the single case
  where the structured answers decide nothing, so the cost of the field lands on
  the applicants whose application actually needs it. Everyone else answers four
  short questions.

Changing the set later is one edit to `apps/members/src/lib/join.ts`. The form,
the validation, and the pending screen all render from those definitions.

### Settled in 3d: what the approval queue does, and what it does not

`/admin`, visible only to an active administrator. Anyone else is redirected to
the front door rather than shown a refusal, since a member who guesses the URL
has done nothing wrong and gains nothing from learning the page exists.

**In:** the pending requests with their answers, approve, decline, and a role
control on the active membership. **Out, deliberately:**

- **Suspension, removal, reinstating a declined applicant.** Member management
  is session 9. This queue answers one question, which is whether somebody gets
  in.
- **Guest approval.** A guest carries an access window and nobody is asked about
  one here. Guests arrive by invitation, which matches the brief.
- **Approving with a role.** Approval is one decision. Appointing is a separate
  act on the member list, which reads better and is the sequence the handover
  needs anyway.

Three things worth not relearning:

- **The last-administrator guard is in the database**, not the console
  (migration 0019). James stepping back from the role is the point of this
  session, and doing it before appointing a replacement would leave a club
  nobody can administer and no route out except Double Blaze staff and the
  service role. The console warns; the database refuses.
- **The decision emails are best effort, and the console says when one fails.**
  The pending screen promises "we will email you as soon as there is an answer",
  and the administrator is the only person who can find out that the promise was
  not kept, so a send failure is reported to them rather than swallowed into a
  clean success.
- **`approved_by` and `approved_at` record declines too.** 0013's reasoning that
  a decision is only reviewable with its inputs applies to a no as much as a
  yes. The columns keep their names and carry comments saying so (0020), because
  renaming them would mean rewriting the policy in 0017 and the guard in 0013 to
  fix a word.

### Settled in 3e: the guest tier, and what is left of it

Open item 7 in the build plan asked who invites a guest, how long access lasts,
what expires when it does, and what they can still see afterward. Three of the
four were already answered elsewhere and were being carried as open because
nobody had written down where the answer was.

| Question | Answer | Where it came from |
|---|---|---|
| Who invites a guest | An administrator | The brief gives administrators "manage guest access" |
| What expires | Everything, at once | `app.is_active_site_member` in 0013 already treats a lapsed window as not being a member, and every policy keyed on it inherits that |
| What they keep | Their articles | A guest is invited so the membership can read what they wrote. Withdrawing it on expiry defeats the reason for inviting them |
| How long | An administrator picks, defaulting to 90 days | A default, not a decision taken for the club |

So the guest tier was never blocking the build. The default is deliberately a
starting position: 90 days covers a speaker at a scheduled meeting and an author
publishing a piece, which are the two cases the brief names, and the club will
settle the real number by using it.

**Two questions do remain, and neither blocks anything now:**

1. **Does a guest see the member directory?** Session 4. A guest is less vetted
   than a member, and the directory is names and employers of utility
   professionals, which section 2 of the build plan already declined to make
   public. Worth deciding rather than defaulting.
2. **Does a lapsed guest keep read access to the library?** Session 5. Today the
   answer is no, because `is_active_site_member` says so, and no is the safe
   direction to be wrong in.

### Settled in 4: profiles, and one question for the club

Every profile field is optional, including the photo. A member is already
admitted by the time they see the form, so a required field would be a barrier
placed after the decision rather than before it. The prompt exists to invite a
profile, not to withhold the site until one exists.

Employer, role, and the free-text answer are prefilled from the join answers, so
a new member's first sight of the form is half filled rather than blank. An
invited member answered no questions, so theirs is empty, which is honest.

Photos live in a private bucket and are served by `/api/media`, never by a
storage URL. A public bucket would make every member's photo enumerable by
anyone holding the publishable key, which is not a thing to do to a club whose
premise is that its inside is not public. **The object path is the security
model**: `<site_id>/<member_id>/<random>`, and both write policies key on those
first two segments, which is why the extension is derived from the mime type
rather than taken from the filename.

**The question for the club: should a guest see the member directory?**

Today they do. `site_members_directory_read` keys on `app.is_active_site_member`,
which includes guests, and an invited guest was chosen individually by an
administrator, which is a higher bar than the self-application path. The
argument the other way is that the directory is names and employers of utility
professionals, section 2 of the build plan already declined to make that public,
and a guest is more transient than a member.

Either is defensible and reversing it is one clause in one policy. It is worth
James putting to the club rather than being defaulted quietly, which is why it
is written here rather than left in the code.

### Settled in 3e: what an invitation is worth

**Possession of an invitation link signs the holder in as the invited address.**
That is worth stating plainly rather than discovering. It is the same bargain
the sign-in email already makes, so it adds no new class of exposure: both are
bearer credentials delivered to an inbox. What bounds it is that the link works
exactly once, expires after fourteen days, is revocable until it is used, and
lives in the database only as a SHA-256 hash.

The membership row is created before the session, and the ordering matters. The
row lands with `auth_user_id` null, so a forwarded link that half-redeems leaves
an unclaimed membership that only somebody who can receive mail at the invited
address can attach to.

If the club ever wants the stronger posture, the change is small: redeem the
token, then email a sign-in link to the invited address rather than signing the
clicker in. It costs one extra email and makes the mailbox the credential rather
than the link. Not done now because the brief asks for a join process that is
"simple and common/known to the one joining", and one click is what everyone
else does.

---

## 5. Bugs found by exercising the real thing

Each lived in a seam between components that worked alone, and none was
reachable by the unit tests. Recorded so they are not reintroduced.

**Magic link type mismatch.** `generateLink({type:'magiclink'})` for an address
with no account does not fail, it creates the identity. With email confirmation
enabled that user is unconfirmed, so Supabase stores a *signup* token rather
than a magiclink one. Verifying with the requested type searched the wrong
place and returned "One-time token not found" under the error code
`otp_expired`, which reached the member as a link that expired the instant it
arrived. Fix: read the type out of the `action_link` Supabase returns rather
than assuming, plus a fallback that tries the other types, since a token is
only consumed by a verification that succeeds.

**The privilege guard blocked its own claim.** `app.guard_site_member_self_update`
exists to stop a member editing their own role or status. Claiming a seeded row
runs as the service role, where `is_staff()` and `is_site_admin()` are both
false, so it fell through to the column checks and filling in `auth_user_id` is
exactly what they reject. **The service role bypasses row level security, but
nothing bypasses a trigger.** Fix: the guard applies only to the `authenticated`
role. Note `auth.role()` rather than `current_user`, because inside a
SECURITY DEFINER function `current_user` is the function owner rather than the
caller and would have matched nothing.

**The identity helpers recursed, and had since session 1.** The first insert the
join form ever attempted failed with `stack depth limit exceeded`, SQLSTATE
54001. `is_staff()`, `current_org_id()` and `current_app_user_id()` from
migration 0001 read the `users` table and were not SECURITY DEFINER, so a policy
calling `is_staff()` ran a select against `users`, whose own policy calls
`is_staff()`, forever.

This is the most useful bug of the three, because of how long it hid and why:

- **Every write so far ran as the service role**, which bypasses row level
  security entirely, so no policy was ever evaluated. Sessions 1 through 3b
  never once exercised this path.
- **The reads that did run under a member session were saved by luck.**
  Permissive policies are OR'd, and `site_members_self_read` is cheap and true
  for the reader's own row, so Postgres short-circuited before reaching the
  staff policy. Nothing guarantees that evaluation order. An insert has no
  self-read policy to short-circuit on, which is why the questionnaire hit it
  immediately.

Fix in 0018, and the shape of the fix is the point. Adding SECURITY DEFINER to
the three public functions works and is wrong: PostgREST exposes `public`, so
each becomes an owner-rights RPC endpoint and the security advisor flags all
three for `anon` and `authenticated`. Moving them to `app` outright would mean
dropping and rebuilding every policy in 0001 that names them, since a policy
holds a function by identity rather than by name. So the definer logic moved to
`app`, and the public functions stayed exactly where the policies expect them as
one-line invoker wrappers. The recursion breaks at the `app` call and nothing
new is reachable over REST.

**The lesson worth carrying:** anything a policy calls must not itself be
subject to a policy. `app.is_site_admin` and its siblings in 0013 already had
this right; the older Clerk-plane helpers did not, and no test could have caught
it because no test ran as `authenticated`.

---

## 6. How this codebase is built

Patterns that emerged across sessions 3 and 4 and are worth continuing, because
consistency here is most of what makes the next session cheap. Each one is a
choice that has already paid for itself at least once.

### Every session has the same four pieces

1. **A pure module in `apps/members/src/lib/`.** Field definitions, validation,
   and copy, with no framework and no database. `join.ts`, `admin.ts`,
   `invitations.ts`, `profile.ts` are the existing four. The form, the API
   route, and any admin view all render from the same definitions, so changing a
   question is one edit rather than three that drift.
2. **A unit test beside it**, run by `node --test` through tsx. These cover what
   is accepted, what is refused, and the copy. Two checks worth repeating in
   every new one: no em dashes, and none of the coordination language the build
   plan flags in section 3. Strip HTML tags before the second, or `vertical-align`
   will trip it.
3. **A migration**, with the reasoning in the file rather than in a commit
   message. The migrations are the most-read documentation in this repository.
4. **A behavioural SQL suite in `supabase/tests/`**, described below. This is
   what catches the bugs unit tests structurally cannot.

### Security lives in policies, not in routes

The rule that has held: **any query that could run under the member's own
session must.** Row level security is what enforces tenancy and privilege, and
the application's checks exist for the error message rather than the security.
Reaching for the service role to make something work is how tenant isolation
quietly stops being enforced.

The service role is used in exactly three places, each with a written reason:
claiming an unclaimed membership, looking up an invitation by a token the holder
cannot read, and listing administrators to notify about an application.

A corollary the pages follow: **do not add a visibility check to a page when a
policy already decides.** The directory and profile pages have none. A second
opinion in a page can only disagree with the policy, and when it does, the page
is what gets trusted.

### Behavioural database tests, and how to run them

`execute_sql` through the MCP tools is read-only, so the trick is a `do $$ ... $$`
block sent through `apply_migration` that ends in `raise exception` carrying its
results. The exception rolls the whole transaction back, so the test can create
sites, auth identities, members, and storage objects, exercise them, and leave
nothing behind, and the failed migration is never recorded.

Four suites exist. They found the recursion in section 5 and they are the only
thing standing behind the multi-tenant claim. Three rules learned the hard way:

- Impersonating a member takes **both** `set local role authenticated` **and**
  `set_config('request.jwt.claims', ...)`. The role decides whether RLS applies;
  the claims are what `auth.uid()`, `auth.jwt()` and `auth.role()` read. One
  without the other tests nothing.
- `reset role` does **not** clear the claims, so `auth.role()` still reports
  `authenticated` and the guards still fire. Clear the claims too when a step
  needs to act as an administrator.
- **Assert on `row_count` after an update.** An update matching zero rows raises
  nothing, so a change that should have been refused reads as a pass. Several
  early drafts of these suites were green and proving nothing.

### Copy

No em dashes, anywhere. Beyond that, everything a member reads goes through the
antitrust pass in build plan section 3: no collaborate, coordinate, align,
agree, or standardize. This applies to email the club sends in its own name, not
just the marketing page, and there is a test enforcing it.

Where a decision affects a person, say the thing rather than the status. A
decline gives no reason because none was asked for. A send failure is reported
to the administrator because they are the only one who can find out. An
applicant sees their own answers read back because the wait is measured in days.

---

## 7. Working notes for a fresh session

Things that cost time to discover in this environment.

- **The agent sandbox cannot reach `doubleblaze.solutions`.** Both `curl` and
  `WebFetch` are refused by the egress proxy. Anything requiring a real HTTP
  request to the live site has to be run by James and pasted back.
- **MCP servers drop and reconnect constantly.** GitHub, Supabase, Vercel and
  Resend all went down and came back several times. `enabledInChat: false` from
  `ListConnectors` reports current attachment, not the user's toggle, so it is
  not evidence of a settings problem. Retry before diagnosing.
- **`execute_sql` is read-only.** Writes need `apply_migration`. Structural
  verification through `pg_policies`, `pg_proc` and `pg_indexes` works well.
- **Behavioural database tests are possible, and worth the trouble.** Send a
  `do $$ ... $$` block through `apply_migration` that ends in
  `raise exception` carrying the results. The exception rolls the whole
  transaction back, so the test can create auth identities and rows, exercise
  them, and leave nothing behind, and the failed migration is never recorded.
  The results arrive in the error message.
  [`supabase/tests/join_policy.sql`](../../../supabase/tests/join_policy.sql) is
  the worked example, and it is what found the recursion in section 5.
  Two things that will otherwise waste an hour:
  - Impersonating a member takes **both** `set local role authenticated` and
    `set_config('request.jwt.claims', ...)`. The role decides whether row level
    security applies; the claims are what `auth.uid()`, `auth.jwt()` and
    `auth.role()` read. Setting one without the other tests nothing.
  - `reset role` does **not** clear the claims, so `auth.role()` still reports
    `authenticated` and the privilege guard still fires. Clear the claims too
    when a step needs to act as an administrator.
  - Assert on `row_count` after an update. An update matching zero rows raises
    nothing, so a check that should have been refused reads as a pass.
- **Images pasted into chat do not reach the filesystem.** Only files attached
  explicitly do. Ask for attachments when a real asset is needed.
- **Supabase auth logs are queryable** through `query_logs` with
  `source = 'auth_logs'`, and they gave the exact cause of the sign-in bug in
  one query. Reach for them early.
- **Preview rendering:** `apps/platform/scripts/render-preview.ts` writes the
  Electric Grid page to a single self-contained HTML file with assets inlined,
  which is how design gates have been delivered.
- **House convention: no em dashes**, anywhere, in docs or generated copy.
